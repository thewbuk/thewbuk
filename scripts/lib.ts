// Text-to-path and small helpers. An SVG shown through <img> on GitHub cannot load
// web fonts, so every word is drawn as a path from the font files in scripts/fonts.
import opentype from "opentype.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const load = (f: string) => {
  const b = readFileSync(join(import.meta.dir, "fonts", f));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
export const FONTS = {
  pixel: load("press-start-2p-latin-400-normal.woff"),
  vt: load("vt323-latin-400-normal.woff"),
};
type FontKey = keyof typeof FONTS;

export function textWidth(str: string, size: number, font: FontKey) {
  return FONTS[font].getAdvanceWidth(str, size);
}

/** Text as a <path>. align: start | middle | end. */
export function T(str: string, x: number, y: number, size: number, font: FontKey, fill: string, align: "start" | "middle" | "end" = "start", attrs = "") {
  const w = textWidth(str, size, font);
  const sx = align === "middle" ? x - w / 2 : align === "end" ? x - w : x;
  const d = FONTS[font].getPath(str, sx, y, size).toPathData(1);
  return `<path d="${d}" fill="${fill}"${attrs ? " " + attrs : ""}/>`;
}

export function svg(w: number, h: number, body: string, css: string, title: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>${css.replace(/\s+/g, " ")} @media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
${body}
</svg>
`;
}

/** Deterministic PRNG so rebuilds don't churn the diff. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function write(dir: string, name: string, content: string) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content);
}
