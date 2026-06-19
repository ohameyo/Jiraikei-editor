import {
  PASSTHROUGH_FRAGMENT_SHADER,
  PASSTHROUGH_VERTEX_SHADER,
} from './shaders.js';
import { normalizeBasicToneParameters } from './basicToneParameters.js';

const CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
};

const MAX_BLUSH_REGIONS = 4;

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

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
    this.updateToneUniforms(request);
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
      skinWhiten: gl.getUniformLocation(program, 'u_skinWhiten'),
      blushStrength: gl.getUniformLocation(program, 'u_blushStrength'),
      blackProtect: gl.getUniformLocation(program, 'u_blackProtect'),
      blushRegionCount: gl.getUniformLocation(program, 'u_blushRegionCount'),
      blushRegions: gl.getUniformLocation(program, 'u_blushRegions[0]'),
      overlayColor: gl.getUniformLocation(program, 'u_overlayColor'),
    };
    this.diagnostics.programBuildCount += 1;
  }

  getToneParameters(filters) {
    return normalizeBasicToneParameters(filters);
  }

  getPortraitToneUniforms(filters = {}, vision = {}, size = {}) {
    const blushRegions = [];
    const addRegion = (x, y, rx, ry) => {
      if (blushRegions.length >= MAX_BLUSH_REGIONS) return;
      const normalizedY = clamp(y, 0, 1);
      blushRegions.push([
        clamp(x, 0, 1),
        1 - normalizedY,
        clamp(rx, 0.01, 0.35),
        clamp(ry, 0.01, 0.3),
      ]);
    };

    if (Number(filters.blushManual ?? 0) > 0.5) {
      if (Number(filters.blushLeftEnabled ?? 1) > 0.5) {
        addRegion(filters.blushLeftX, filters.blushLeftY, filters.blushLeftRX, filters.blushLeftRY);
      }
      if (Number(filters.blushRightEnabled ?? 1) > 0.5) {
        addRegion(filters.blushRightX, filters.blushRightY, filters.blushRightRX, filters.blushRightRY);
      }
      if (Number(filters.blushExtraEnabled ?? 0) > 0.5) {
        if (Number(filters.blushExtraLeftEnabled ?? 1) > 0.5) {
          addRegion(filters.blushExtraLeftX, filters.blushExtraLeftY, filters.blushExtraLeftRX, filters.blushExtraLeftRY);
        }
        if (Number(filters.blushExtraRightEnabled ?? 1) > 0.5) {
          addRegion(filters.blushExtraRightX, filters.blushExtraRightY, filters.blushExtraRightRX, filters.blushExtraRightRY);
        }
      }
      return { blushRegions };
    }

    const width = Math.max(1, Number(size.width) || 1);
    const height = Math.max(1, Number(size.height) || 1);
    const faceBoxes = Array.isArray(vision?.faceBoxes) ? vision.faceBoxes : [];
    for (const box of faceBoxes) {
      if (blushRegions.length >= MAX_BLUSH_REGIONS) break;
      const x = Number(box?.x);
      const y = Number(box?.y);
      const w = Number(box?.width);
      const h = Number(box?.height);
      if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) continue;
      const cy = (y + h * 0.44) / height;
      addRegion((x + w * 0.37) / width, cy, Math.max(8, w * 0.115) / width, Math.max(8, h * 0.09) / height);
      addRegion((x + w * 0.63) / width, cy, Math.max(8, w * 0.115) / width, Math.max(8, h * 0.09) / height);
    }

    return { blushRegions };
  }

  updateToneUniforms(request) {
    const gl = this.gl;
    const filters = request.filters || {};
    const parameters = this.getToneParameters(filters);
    const portrait = this.getPortraitToneUniforms(filters, request.vision, request.size);
    const blushRegionData = new Float32Array(MAX_BLUSH_REGIONS * 4);
    portrait.blushRegions.forEach((region, index) => {
      blushRegionData.set(region, index * 4);
    });
    gl.uniform1f(this.uniforms.brightness, parameters.brightness);
    gl.uniform1f(this.uniforms.contrast, parameters.contrast);
    gl.uniform1f(this.uniforms.saturation, parameters.saturation);
    gl.uniform1f(this.uniforms.temperature, parameters.temperature);
    gl.uniform1f(this.uniforms.tint, parameters.tint);
    gl.uniform1f(this.uniforms.fade, parameters.fade);
    gl.uniform1f(this.uniforms.overlayStrength, parameters.overlayStrength);
    gl.uniform1f(this.uniforms.skinWhiten, parameters.skinWhiten);
    gl.uniform1f(this.uniforms.blushStrength, parameters.blushStrength);
    gl.uniform1f(this.uniforms.blackProtect, parameters.blackProtect);
    gl.uniform1i(this.uniforms.blushRegionCount, portrait.blushRegions.length);
    gl.uniform4fv(this.uniforms.blushRegions, blushRegionData);
    gl.uniform3fv(this.uniforms.overlayColor, parameters.overlayColorRgb);
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
