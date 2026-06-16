import {
  PASSTHROUGH_FRAGMENT_SHADER,
  PASSTHROUGH_VERTEX_SHADER,
} from './shaders.js';
import { normalizeBasicToneParameters } from './basicToneParameters.js';
import {
  MIGRATED_HSL_CHANNEL_IDS,
  normalizeMigratedHslParameters,
} from './advancedToneParameters.js';

const CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
};

export class WebGLToneRenderer {
  constructor({
    canvasFactory = () => document.createElement('canvas'),
    forceFailure = false,
  } = {}) {
    this.canvasFactory = canvasFactory;
    this.forceFailure = forceFailure;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.vertexArray = null;
    this.vertexBuffer = null;
    this.texture = null;
    this.uniforms = null;
    this.lastSourceKey = null;
    this.lastSourceWidth = 0;
    this.lastSourceHeight = 0;
    this.diagnostics = {
      programBuildCount: 0,
      textureUploadCount: 0,
      uniformUpdateCount: 0,
    };
  }

  isSupported() {
    try {
      return Boolean(this.ensureContext());
    } catch {
      return false;
    }
  }

  render(request) {
    if (this.forceFailure) {
      throw new Error('Forced WebGL tone failure');
    }

    const gl = this.ensureContext();
    if (!gl || gl.isContextLost?.()) {
      throw new Error('WebGL2 is unavailable');
    }

    this.ensureResources();

    const { width, height } = request.size;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vertexArray);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.updateToneUniforms(request.filters);
    const sourceKey = request.sourceKey ?? request.sourceCanvas;
    if (
      sourceKey !== this.lastSourceKey ||
      width !== this.lastSourceWidth ||
      height !== this.lastSourceHeight
    ) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        request.sourceCanvas,
      );
      this.lastSourceKey = sourceKey;
      this.lastSourceWidth = width;
      this.lastSourceHeight = height;
      this.diagnostics.textureUploadCount += 1;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new Error(`WebGL tone rendering failed with error ${error}`);
    }

    const ctx = request.targetContext;
    ctx.save();
    try {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(this.canvas, 0, 0, width, height);
    } finally {
      ctx.restore();
    }
  }

  ensureContext() {
    if (this.gl) return this.gl;
    this.canvas = this.canvas || this.canvasFactory();
    this.gl = this.canvas?.getContext?.('webgl2', CONTEXT_ATTRIBUTES) || null;
    return this.gl;
  }

  ensureResources() {
    if (this.program) return;

    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, PASSTHROUGH_VERTEX_SHADER);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, PASSTHROUGH_FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Unknown link error';
      gl.deleteProgram(program);
      throw new Error(`WebGL tone program link failed: ${message}`);
    }

    const vertexArray = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const vertices = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
      -1,  1, 0, 1,
       1, -1, 1, 0,
       1,  1, 1, 1,
    ]);

    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'u_source'), 0);
    gl.bindVertexArray(null);

    this.program = program;
    this.vertexArray = vertexArray;
    this.vertexBuffer = vertexBuffer;
    this.texture = texture;
    this.uniforms = {
      brightness: gl.getUniformLocation(program, 'u_brightness'),
      contrast: gl.getUniformLocation(program, 'u_contrast'),
      saturation: gl.getUniformLocation(program, 'u_saturation'),
      temperature: gl.getUniformLocation(program, 'u_temperature'),
      tint: gl.getUniformLocation(program, 'u_tint'),
      fade: gl.getUniformLocation(program, 'u_fade'),
      overlayStrength: gl.getUniformLocation(program, 'u_overlayStrength'),
      overlayColor: gl.getUniformLocation(program, 'u_overlayColor'),
      hsl: Object.fromEntries(
        MIGRATED_HSL_CHANNEL_IDS.map((channel) => [
          channel,
          gl.getUniformLocation(program, `u_hsl_${channel}`),
        ]),
      ),
    };
    this.diagnostics.programBuildCount += 1;
  }

  getToneParameters(filters) {
    return {
      ...normalizeBasicToneParameters(filters),
      hsl: normalizeMigratedHslParameters(filters),
    };
  }

  updateToneUniforms(filters) {
    const gl = this.gl;
    const parameters = this.getToneParameters(filters);
    gl.uniform1f(this.uniforms.brightness, parameters.brightness);
    gl.uniform1f(this.uniforms.contrast, parameters.contrast);
    gl.uniform1f(this.uniforms.saturation, parameters.saturation);
    gl.uniform1f(this.uniforms.temperature, parameters.temperature);
    gl.uniform1f(this.uniforms.tint, parameters.tint);
    gl.uniform1f(this.uniforms.fade, parameters.fade);
    gl.uniform1f(this.uniforms.overlayStrength, parameters.overlayStrength);
    gl.uniform3fv(this.uniforms.overlayColor, parameters.overlayColorRgb);
    for (const channel of MIGRATED_HSL_CHANNEL_IDS) {
      const hsl = parameters.hsl[channel];
      gl.uniform3fv(this.uniforms.hsl[channel], [hsl.h, hsl.s, hsl.l]);
    }
    this.diagnostics.uniformUpdateCount += 1;
  }

  getDiagnostics() {
    return { ...this.diagnostics };
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown compile error';
      gl.deleteShader(shader);
      throw new Error(`WebGL tone shader compile failed: ${message}`);
    }

    return shader;
  }

  dispose() {
    const gl = this.gl;
    if (gl) {
      if (this.texture) gl.deleteTexture(this.texture);
      if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
      if (this.vertexArray) gl.deleteVertexArray(this.vertexArray);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.texture = null;
    this.vertexBuffer = null;
    this.vertexArray = null;
    this.program = null;
    this.uniforms = null;
    this.lastSourceKey = null;
    this.lastSourceWidth = 0;
    this.lastSourceHeight = 0;
    this.gl = null;
    this.canvas = null;
  }
}
