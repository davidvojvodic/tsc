export type OptimizedImage = {
  src: string;
  blur?: string;
  width?: number;
  height?: number;
};

// Manually define the optimized images with their blur data
export const optimizedImages = {
  hero: {
    src: "/optimized/hero.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAT0lEQVR4nAFEALv/APj49//2/f3/R01d/4qVp/8AtJWU/zwLEP8ACCP/XnqU/wCvnZ//Pxob/5uCM/++r2n/AP79/v////7/eF1M/4aAZf+hfipQDEDVowAAAABJRU5ErkJggg==",
    width: 757,
    height: 759,
  },
  heroUpscaled: {
    src: "/optimized/hero-upscaled.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAT0lEQVR4nAFEALv/APr4+v/4/f3/YFxs/5uapP8ArI6P/1MHCP8AABL/ZXmP/wC9paT/USsj/5h/Mf/Erm7/AP78/v/+//7/hmRR/5Z9Yf9AiSxdQsJVjwAAAABJRU5ErkJggg==",
    width: 1514,
    height: 1518,
  },
  tscHero: {
    src: "/optimized/tsc-hero.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAASElEQVR4nGOYXyX1n6GiW4gh7d88BgbGNobJD5YyqG9nYGBl4mOYEirFsP2POwODNFMkg8bJVQxffnkxMMgLiTHc3NzK8J8NAGgqDgfIdAhGAAAAAElFTkSuQmCC",
    width: 1444,
    height: 1444,
  },
  cro: {
    src: "/optimized/cro.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAPElEQVR4nGP48ffbf4Yj/78x3P33keHp+/cMNhzuDOz8XgzMf1wZWv//ZGDgVGOQD/NlCPcsY3B2tmX4DwAx3Q5fU9mVLQAAAABJRU5ErkJggg==",
    width: 1600,
    height: 1200,
  },
  sola: {
    src: "/optimized/sola.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAKUlEQVR4nGP4s3Xc/3v//jIwiJxmYGA2Y2BwtWdguH2IgUEkmYFBXwsAN0YHv7CrJMsAAAAASUVORK5CYII=",
    width: 1600,
    height: 739,
  },
  schoolStartTimes: {
    src: "/optimized/school-start-times.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAJklEQVR4nGP4n3P5P4M7hwfD7y//Gf69+8PAwPiXgYHnDQODCTMAI5wITdMyyxgAAAAASUVORK5CYII=",
    width: 1280,
    height: 720,
  },
  waterwise: {
    src: "/optimized/waterwise.webp",
    blur: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAOElEQVR4nGOYf7rl/3/GGwyMTBwMDU3NDMvCFRkY2S0YGP+JMCxo/c3A8PsjA8PPPwyeHnwM/wEAgSoKk6YX5zEAAAAASUVORK5CYII=",
    width: 1449,
    height: 977,
  },
};