import { hslFilterKey } from './advancedToneParameters.js';

export const ADVANCED_TONE_FIXTURE_RISK_TAGS = Object.freeze([
  'light-skin',
  'medium-skin',
  'deep-skin',
  'black-hair',
  'dark-clothes',
  'red-lip',
  'heavy-blush',
  'whitening',
  'export-parity',
]);

export const ADVANCED_TONE_FIXTURES = Object.freeze([
  Object.freeze({
    id: 'fair-skin-black-hair',
    label: '浅肤色黑发',
    width: 320,
    height: 420,
    background: '#eee7ee',
    hairColor: '#17151c',
    skinColor: '#efc6ae',
    blushColor: '#e8899a',
    lipColor: '#a83f55',
    clothesColor: '#2a2630',
    faceBox: Object.freeze({ x: 88, y: 84, width: 144, height: 178 }),
    riskTags: Object.freeze(['light-skin', 'black-hair', 'red-lip', 'heavy-blush', 'whitening', 'export-parity']),
  }),
  Object.freeze({
    id: 'medium-skin-dark-clothes',
    label: '中肤色深色衣物',
    width: 320,
    height: 420,
    background: '#d9d3da',
    hairColor: '#201b20',
    skinColor: '#bc7e5b',
    blushColor: '#d77784',
    lipColor: '#973849',
    clothesColor: '#19191f',
    faceBox: Object.freeze({ x: 90, y: 88, width: 140, height: 174 }),
    riskTags: Object.freeze(['medium-skin', 'black-hair', 'dark-clothes', 'heavy-blush', 'export-parity']),
  }),
  Object.freeze({
    id: 'deep-skin-red-lip',
    label: '深肤色红唇',
    width: 320,
    height: 420,
    background: '#d8d0d5',
    hairColor: '#141217',
    skinColor: '#6b4331',
    blushColor: '#b95f6c',
    lipColor: '#9d2f43',
    clothesColor: '#26202a',
    faceBox: Object.freeze({ x: 92, y: 90, width: 136, height: 170 }),
    riskTags: Object.freeze(['deep-skin', 'black-hair', 'dark-clothes', 'red-lip', 'whitening', 'export-parity']),
  }),
]);

export const ADVANCED_TONE_VISUAL_QA_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'hsl-skin-lip-check',
    label: 'HSL 肤色与唇色核对',
    fixtureIds: Object.freeze(['fair-skin-black-hair', 'deep-skin-red-lip']),
    filters: Object.freeze({
      [hslFilterKey('skin', 'h')]: 5,
      [hslFilterKey('skin', 's')]: 10,
      [hslFilterKey('skin', 'l')]: 8,
      [hslFilterKey('lip', 'h')]: -7,
      [hslFilterKey('lip', 's')]: 18,
      [hslFilterKey('lip', 'l')]: 3,
    }),
  }),
  Object.freeze({
    id: 'whiten-heavy-blush-check',
    label: '美白与重腮红核对',
    fixtureIds: Object.freeze(['fair-skin-black-hair', 'medium-skin-dark-clothes']),
    filters: Object.freeze({
      skinWhiten: 0.58,
      blushStrength: 0.64,
    }),
  }),
  Object.freeze({
    id: 'black-hair-dark-clothes-check',
    label: '黑发深衣保护核对',
    fixtureIds: Object.freeze(['fair-skin-black-hair', 'medium-skin-dark-clothes', 'deep-skin-red-lip']),
    filters: Object.freeze({
      blackProtect: 0.94,
      [hslFilterKey('black', 's')]: -38,
      [hslFilterKey('black', 'l')]: -5,
    }),
  }),
  Object.freeze({
    id: 'combined-export-check',
    label: '综合预览导出核对',
    fixtureIds: Object.freeze(['fair-skin-black-hair', 'medium-skin-dark-clothes', 'deep-skin-red-lip']),
    filters: Object.freeze({
      brightness: 1.08,
      contrast: 0.94,
      saturation: 0.76,
      temperature: -10,
      tint: 9,
      fade: 0.08,
      skinWhiten: 0.42,
      blushStrength: 0.42,
      blackProtect: 0.82,
      [hslFilterKey('master', 's')]: -16,
      [hslFilterKey('skin', 'l')]: 8,
      [hslFilterKey('lip', 's')]: 12,
      [hslFilterKey('black', 'l')]: -3,
    }),
  }),
]);

export function getAdvancedToneFixtureIds() {
  return ADVANCED_TONE_FIXTURES.map((fixture) => fixture.id);
}

export function validateAdvancedToneFixtureCoverage(fixtures = ADVANCED_TONE_FIXTURES) {
  const coveredTags = new Set(fixtures.flatMap((fixture) => fixture.riskTags || []));
  const missingTags = ADVANCED_TONE_FIXTURE_RISK_TAGS.filter((tag) => !coveredTags.has(tag));
  return {
    ok: missingTags.length === 0,
    missingTags,
  };
}

function drawEllipse(context, cx, cy, rx, ry, fillStyle) {
  context.save();
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  context.fillStyle = fillStyle;
  context.fill();
  context.restore();
}

export function createAdvancedToneFixtureCanvas(fixture, documentLike = globalThis.document, scale = 1) {
  if (!fixture) {
    throw new TypeError('createAdvancedToneFixtureCanvas requires a fixture');
  }
  const canvas = documentLike.createElement('canvas');
  canvas.width = fixture.width * scale;
  canvas.height = fixture.height * scale;
  const context = canvas.getContext('2d');
  context.scale(scale, scale);

  const gradient = context.createLinearGradient(0, 0, fixture.width, fixture.height);
  gradient.addColorStop(0, fixture.background);
  gradient.addColorStop(1, '#f8edf5');
  context.fillStyle = gradient;
  context.fillRect(0, 0, fixture.width, fixture.height);

  context.fillStyle = fixture.clothesColor;
  context.beginPath();
  context.moveTo(70, 380);
  context.quadraticCurveTo(160, 250, 250, 380);
  context.lineTo(286, 420);
  context.lineTo(34, 420);
  context.closePath();
  context.fill();

  drawEllipse(context, 160, 154, 92, 124, fixture.hairColor);
  drawEllipse(context, 160, 176, 70, 94, fixture.skinColor);
  drawEllipse(context, 120, 190, 26, 14, fixture.blushColor);
  drawEllipse(context, 200, 190, 26, 14, fixture.blushColor);
  drawEllipse(context, 160, 224, 24, 10, fixture.lipColor);
  drawEllipse(context, 136, 138, 14, 20, 'rgba(255,255,255,0.42)');
  drawEllipse(context, 135, 170, 6, 8, 'rgba(25,21,28,0.92)');
  drawEllipse(context, 185, 170, 6, 8, 'rgba(25,21,28,0.92)');

  context.strokeStyle = 'rgba(255,255,255,0.18)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(90, 88);
  context.quadraticCurveTo(160, 42, 230, 88);
  context.stroke();

  return canvas;
}
