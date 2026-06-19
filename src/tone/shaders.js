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
uniform float u_skinWhiten;
uniform float u_blushStrength;
uniform float u_blackProtect;
uniform int u_blushRegionCount;
uniform vec4 u_blushRegions[4];
uniform vec3 u_overlayColor;
in vec2 v_texCoord;
out vec4 outColor;

vec3 quantizeRgb(vec3 color) {
  return floor(clamp(color, 0.0, 1.0) * 255.0 + 0.5) / 255.0;
}

vec3 blendFill(vec3 color, vec3 fillColor, float alpha) {
  return quantizeRgb(mix(color, fillColor, clamp(alpha, 0.0, 1.0)));
}

float skinWhitenMask(vec3 originalColor) {
  float originalLuma = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114)) * 255.0;
  float maxChannel = max(originalColor.r, max(originalColor.g, originalColor.b));
  float minChannel = min(originalColor.r, min(originalColor.g, originalColor.b));
  float chroma = maxChannel - minChannel;
  float warmBalance = smoothstep(-0.05, 0.16, originalColor.r - originalColor.b);
  float greenGuard = 1.0 - smoothstep(0.08, 0.24, originalColor.g - max(originalColor.r, originalColor.b));
  float lumaMask = smoothstep(42.0, 92.0, originalLuma) * (1.0 - smoothstep(232.0, 250.0, originalLuma));
  float chromaMask = smoothstep(0.025, 0.12, chroma) * (1.0 - smoothstep(0.46, 0.72, chroma));
  return clamp(warmBalance * greenGuard * lumaMask * chromaMask, 0.0, 1.0);
}

float ellipseBlushMask(vec2 uv) {
  float best = 0.0;
  for (int i = 0; i < 4; i += 1) {
    if (i >= u_blushRegionCount) break;
    vec4 region = u_blushRegions[i];
    vec2 radius = max(region.zw, vec2(0.001));
    vec2 d = (uv - region.xy) / radius;
    float dist = length(d);
    float gaussian = exp(-dist * dist * 1.36);
    float tail = 1.0 - smoothstep(1.38, 1.96, dist);
    best = max(best, gaussian * tail);
  }
  return clamp(best, 0.0, 1.0);
}

float blushMask(vec3 originalColor, vec2 uv) {
  if (u_blushRegionCount <= 0) return 0.0;
  float originalLuma = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114)) * 255.0;
  float maxChannel = max(originalColor.r, max(originalColor.g, originalColor.b));
  float minChannel = min(originalColor.r, min(originalColor.g, originalColor.b));
  float chroma = maxChannel - minChannel;
  float skinMask = skinWhitenMask(originalColor);
  float cheekMask = ellipseBlushMask(uv);
  float lumaMask = smoothstep(52.0, 112.0, originalLuma) * (1.0 - smoothstep(230.0, 250.0, originalLuma));
  float chromaGuard = 1.0 - smoothstep(0.46, 0.72, chroma);
  return clamp(max(skinMask, lumaMask * 0.42) * chromaGuard * cheekMask, 0.0, 1.0);
}

float blackProtectMask(vec3 originalColor) {
  float originalLuma = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114)) * 255.0;
  float maxChannel = max(originalColor.r, max(originalColor.g, originalColor.b));
  float minChannel = min(originalColor.r, min(originalColor.g, originalColor.b));
  float chroma = maxChannel - minChannel;
  float darkMask = 1.0 - smoothstep(44.0, 152.0, originalLuma);
  float neutralMask = 1.0 - smoothstep(0.08, 0.38, chroma);
  return clamp(darkMask * mix(0.68, 1.0, neutralMask), 0.0, 1.0);
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

  float skinWhiten = clamp(u_skinWhiten, 0.0, 1.0) * skinWhitenMask(source.rgb);
  color = mix(color, vec3(1.0, 248.0 / 255.0, 1.0), skinWhiten * 0.2);
  color.g = mix(color.g, (color.r + color.b) * 0.5, skinWhiten * 0.06);
  color = quantizeRgb(color);

  float blush = clamp(u_blushStrength, 0.0, 1.0) * blushMask(source.rgb, v_texCoord);
  color = mix(color, vec3(1.0, 122.0 / 255.0, 184.0 / 255.0), blush * 0.34);
  color.r = mix(color.r, min(1.0, color.r + 0.08), blush * 0.38);
  color.b = mix(color.b, min(1.0, color.b + 0.035), blush * 0.24);
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

  float blackProtect = clamp(u_blackProtect, 0.0, 1.0) * blackProtectMask(source.rgb);
  vec3 protectedBlack = min(source.rgb, color);
  protectedBlack = mix(protectedBlack, protectedBlack * 0.88, blackProtect * 0.18);
  color = mix(color, protectedBlack, blackProtect * 0.9);
  color = quantizeRgb(color);

  outColor = vec4(color, source.a);
}
`;
