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
uniform vec3 u_hsl_master;
uniform vec3 u_hsl_red;
uniform vec3 u_hsl_orange;
uniform vec3 u_hsl_yellow;
uniform vec3 u_hsl_green;
uniform vec3 u_hsl_cyan;
uniform vec3 u_hsl_blue;
uniform vec3 u_hsl_purple;
in vec2 v_texCoord;
out vec4 outColor;

vec3 quantizeRgb(vec3 color) {
  return floor(clamp(color, 0.0, 1.0) * 255.0 + 0.5) / 255.0;
}

vec3 blendFill(vec3 color, vec3 fillColor, float alpha) {
  return quantizeRgb(mix(color, fillColor, clamp(alpha, 0.0, 1.0)));
}

float hueDistance(float a, float b) {
  float d = mod(abs(a - b), 360.0);
  return d > 180.0 ? 360.0 - d : d;
}

float hueChannelWeight(float h, float sat, float center, float width) {
  float dist = hueDistance(h, center);
  float base = 1.0 - smoothstep(width * 0.62, width, dist);
  float chroma = smoothstep(0.05, 0.24, sat);
  return clamp(base * chroma, 0.0, 1.0);
}

vec3 rgbToHsl(vec3 color) {
  float maxC = max(max(color.r, color.g), color.b);
  float minC = min(min(color.r, color.g), color.b);
  float delta = maxC - minC;
  float light = (maxC + minC) * 0.5;
  float hue = 0.0;
  float sat = 0.0;

  if (delta > 0.000001) {
    sat = delta / (1.0 - abs(2.0 * light - 1.0));
    if (maxC == color.r) {
      hue = mod((color.g - color.b) / delta, 6.0);
    } else if (maxC == color.g) {
      hue = ((color.b - color.r) / delta) + 2.0;
    } else {
      hue = ((color.r - color.g) / delta) + 4.0;
    }
    hue *= 60.0;
    if (hue < 0.0) hue += 360.0;
  }

  return vec3(hue, sat, light);
}

vec3 hslToRgb(vec3 hsl) {
  float hue = mod(hsl.x, 360.0);
  float sat = clamp(hsl.y, 0.0, 1.0);
  float light = clamp(hsl.z, 0.0, 1.0);
  float c = (1.0 - abs(2.0 * light - 1.0)) * sat;
  float hp = hue / 60.0;
  float x = c * (1.0 - abs(mod(hp, 2.0) - 1.0));
  vec3 rgb;

  if (hp < 1.0) rgb = vec3(c, x, 0.0);
  else if (hp < 2.0) rgb = vec3(x, c, 0.0);
  else if (hp < 3.0) rgb = vec3(0.0, c, x);
  else if (hp < 4.0) rgb = vec3(0.0, x, c);
  else if (hp < 5.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);

  float m = light - c * 0.5;
  return rgb + vec3(m);
}

void applyHslChannel(inout float h, inout float s, inout float l, vec3 controls, float weight, float hueScale, float satScale, float lightScale) {
  if (weight <= 0.0001) return;
  h = mod(h + controls.x * hueScale * weight + 360.0, 360.0);
  s = clamp(s * (1.0 + (controls.y / 100.0) * satScale * weight), 0.0, 1.0);
  l = clamp(l + (controls.z / 100.0) * lightScale * weight, 0.0, 1.0);
}

vec3 applyMigratedHsl(vec3 color) {
  vec3 hsl = rgbToHsl(clamp(color, 0.0, 1.0));
  float baseH = hsl.x;
  float baseS = hsl.y;
  float lowSaturationGuard = smoothstep(0.0, 0.22, 0.22 - hsl.y);
  float hslSafety = 1.0 - clamp(lowSaturationGuard * 0.55, 0.0, 0.86);
  float masterSafety = max(hslSafety, 0.68);

  applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_master, masterSafety, 1.35, 1.12, 0.34);

  float channelSat = max(hsl.y, baseS * 0.82);
  if (max(hsl.y, baseS) >= 0.045) {
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_red, hueChannelWeight(baseH, channelSat, 0.0, 34.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_orange, hueChannelWeight(baseH, channelSat, 28.0, 32.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_yellow, hueChannelWeight(baseH, channelSat, 56.0, 34.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_green, hueChannelWeight(baseH, channelSat, 122.0, 38.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_cyan, hueChannelWeight(baseH, channelSat, 182.0, 38.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_blue, hueChannelWeight(baseH, channelSat, 228.0, 36.0), 1.2, 1.08, 0.28);
    applyHslChannel(hsl.x, hsl.y, hsl.z, u_hsl_purple, hueChannelWeight(baseH, channelSat, 286.0, 38.0), 1.2, 1.08, 0.28);
  }

  return hslToRgb(hsl);
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
  color = applyMigratedHsl(color);

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
