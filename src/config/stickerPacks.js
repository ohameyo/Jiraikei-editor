function svgData(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const heart = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 180'><path d='M100 168s-82-42-82-101c0-31 24-53 52-53 14 0 24 5 30 16 6-11 16-16 30-16 28 0 52 22 52 53 0 59-82 101-82 101z' fill='#f7c0da' stroke='#5a4255' stroke-width='10'/></svg>`
);

const bow = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 140'><path d='M108 70c-16-30-58-64-96-48 11 20 30 49 72 58-42 9-61 38-72 58 38 16 80-18 96-48 16 30 58 64 96 48-11-20-30-49-72-58 42-9 61-38 72-58-38-16-80 18-96 48z' fill='#f1d3f4' stroke='#5d4d66' stroke-width='8'/><circle cx='110' cy='70' r='22' fill='#fff0fb' stroke='#5d4d66' stroke-width='8'/></svg>`
);

const cross = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><path d='M65 10h30v50h50v30H95v60H65V90H15V60h50z' fill='#d8d1ea' stroke='#4f455e' stroke-width='8'/></svg>`
);

const bandage = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 100'><rect x='10' y='20' width='200' height='60' rx='28' fill='#f5e1e8' stroke='#8a6e7e' stroke-width='7'/><g fill='#b894a7'>${Array.from({ length: 10 }, (_, i) => `<circle cx='${42 + i * 16}' cy='50' r='3'/>`).join('')}</g></svg>`
);

const sparkle = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><path d='M80 10l12 46 46 12-46 12-12 46-12-46-46-12 46-12z' fill='#fff4ca' stroke='#75635c' stroke-width='8'/></svg>`
);

const cyber = svgData(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 220'><circle cx='110' cy='110' r='74' fill='none' stroke='#60546f' stroke-width='10'/><path d='M110 36v148M36 110h148M54 54l112 112M166 54L54 166' stroke='#bba8d9' stroke-width='8'/></svg>`
);

export const STICKER_PACKS = [
  {
    id: 'cute-core',
    name: '心形与蝴蝶结',
    stickers: [
      { id: 'heart-soft', name: '柔软爱心', src: heart },
      { id: 'bow-lace', name: '蕾丝蝴蝶结', src: bow },
      { id: 'sparkle', name: '闪光', src: sparkle },
    ],
  },
  {
    id: 'gloom-core',
    name: '十字与绷带',
    stickers: [
      { id: 'cross', name: '十字', src: cross },
      { id: 'bandage', name: '绷带', src: bandage },
      { id: 'cyber-symbol', name: '赛博符号', src: cyber },
    ],
  },
];
