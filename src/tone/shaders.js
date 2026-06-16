export const PASSTHROUGH_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const PASSTHROUGH_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_source;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;
uniform float u_fade;
uniform float u_overlayStrength;
uniform vec3 u_overlayColor;
in vec2 v_texCoord;
out vec4 outColor;

vec3 quantizeRgb(vec3 color) {
  return floor(clamp(color, 0.0, 1.0) * 255.0 + 0.5) / 255.0;
}

vec3 blendFill(vec3 color, vec3 fillColor, float alpha) {
  return quantizeRgb(mix(color, fillColor, clamp(alpha, 0.0, 1.0)));
}

void main() {
  vec4 source = texture(u_source, v_texCoord);
  if (source.a < (0.5 / 255.0)) {
    outColor = source;
    return;
  }

  vec3 color = source.rgb * u_brightness;
  color = (color - vec3(128.0 / 255.0)) * u_contrast + vec3(128.0 / 255.0);
  float basicLuma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color = vec3(basicLuma) + (color - vec3(basicLuma)) * u_saturation;
  color = quantizeRgb(color);

  float temperatureAlpha = abs(u_temperature / 100.0) * 0.16;
  vec3 temperatureColor = u_temperature < 0.0
    ? vec3(154.0, 184.0, 255.0) / 255.0
    : vec3(255.0, 204.0, 148.0) / 255.0;
  color = blendFill(color, temperatureColor, temperatureAlpha);

  float tintAlpha = abs(u_tint / 100.0) * 0.14;
  vec3 tintColor = u_tint > 0.0
    ? vec3(242.0, 180.0, 236.0) / 255.0
    : vec3(188.0, 234.0, 255.0) / 255.0;
  color = blendFill(color, tintColor, tintAlpha);

  color = blendFill(color, vec3(245.0, 239.0, 246.0) / 255.0, u_fade);

  float overlayLuma = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * 255.0;
  float darkGuard = smoothstep(24.0, 96.0, overlayLuma);
  float midBoost = smoothstep(84.0, 196.0, overlayLuma);
  float overlayAlpha = clamp(
    u_overlayStrength * (0.22 * darkGuard + 0.92 * midBoost),
    0.0,
    0.9
  );
  vec3 mixed = mix(color, u_overlayColor, overlayAlpha);
  float lift = overlayAlpha * smoothstep(128.0, 255.0, overlayLuma) * 0.16;
  color = quantizeRgb(mixed + (vec3(1.0) - mixed) * lift);

  outColor = vec4(color, source.a);
}
`;
