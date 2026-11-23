// Builds the arcade-style profile SVGs into svg/. Run: bun scripts/build.ts
// Stats come from data/stats.json (refreshed daily by .github/workflows/stats.yml).
import * as si from "simple-icons";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { T, svg, write, rng, textWidth } from "./lib";
import { header as gameHeader } from "./header";

const ROOT = join(import.meta.dir, "..");
const OUT = join(ROOT, "svg");

const NAME = ["WOJCIECH", "BANDZEREWICZ"];
const LINE = "Senior full-stack and AI engineer.";
const APPS = [
  { slug: "neverthink", name: "NEVERTHINK", line: "Internet TV with no algorithm.", art: "tv" },
  { slug: "terraink", name: "TERRAINK", line: "Map posters of anywhere.", art: "map" },
  { slug: "concrete-shelf", name: "CONCRETE SHELF", line: "A shelf for the books you've read.", art: "shelf" },
  { slug: "terraink-runs", name: "TERRAINK RUNS", line: "Turn a run into a film.", art: "run" },
];
const LINKS = [
  { slug: "site", label: "THEWB.UK" },
  { slug: "linkedin", label: "LINKEDIN" },
  { slug: "email", label: "EMAIL" },
];
const ICONS = ["siTypescript", "siReact", "siNextdotjs", "siExpo", "siNodedotjs", "siBun", "siConvex", "siPostgresql", "siTailwindcss", "siPython", "siDocker", "siClaude"]
  .map((k) => (si as any)[k] as { title: string; path: string });

const BG = "#111019", FG = "#F4F1E8", Y = "#FFD23F", C = "#3DDBD9", R = "#FF5964", S = "#2A2838", DIM = "#6B6785";

const px = (cells: string[], x: number, y: number, s: number, map: Record<string, string>) =>
  cells.map((row, j) => [...row].map((ch, i) => (map[ch] ? `<rect x="${x + i * s}" y="${y + j * s}" width="${s}" height="${s}" fill="${map[ch]}"/>` : "")).join("")).join("");
const scan = (w: number, h: number) =>
  `<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity=".28"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#scan)"/>`;

/* ── header ── */
function header() {
  const runner = [
    ["..YY..", "..YY..", ".YYYY.", "Y.YY.Y", "..YY..", ".Y..Y.", "Y....Y"],
    ["..YY..", "..YY..", ".YYYY.", ".YYYY.", "..YY..", "..YY..", ".Y.Y.."],
  ];
  const css = `
.f0{animation:f .4s steps(1) infinite}.f1{animation:f .4s steps(1) infinite reverse}@keyframes f{0%{opacity:1}50%{opacity:0}}
.mv{animation:mv 9s linear infinite}@keyframes mv{from{transform:translateX(-60px)}to{transform:translateX(1260px)}}
.bl{animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}
.coin{animation:cn .8s steps(4) infinite;transform-box:fill-box;transform-origin:center}@keyframes cn{50%{transform:scaleX(.2)}}`;
  const ground = Array.from({ length: 75 }, (_, i) => `<rect x="${i * 16}" y="344" width="16" height="16" fill="${i % 2 ? "#3A3554" : "#2E2A44"}"/>`).join("");
  const coins = [300, 520, 760, 980].map((x) => `<rect class="coin" x="${x}" y="296" width="16" height="16" fill="${Y}"/>`).join("");
  const lineW = textWidth(LINE, 34, "vt");
  const body = `<rect width="1200" height="380" fill="${BG}"/>
${T(NAME[0], 44, 120, 64, "pixel", FG)}
${T(NAME[1], 44, 206, 64, "pixel", Y)}
${T(LINE, 48, 262, 34, "vt", C)}
<rect class="bl" x="${48 + lineW + 8}" y="254" width="16" height="6" fill="${C}"/>
${ground}${coins}
<g class="mv"><g class="f0">${px(runner[0], 0, 288, 8, { Y: R })}</g><g class="f1">${px(runner[1], 0, 288, 8, { Y: R })}</g></g>
${scan(1200, 380)}`;
  return svg(1200, 380, body, css, `Wojciech Bandzerewicz. ${LINE}`);
}

/* ── app cartridges ── */
function cartridge(a: (typeof APPS)[number], i: number) {
  const W = 600, H = 420, col = [C, Y, R, C][i];
  let art = "", css = "";
  if (a.art === "tv") {
    const on = ["..X....X..", "...X..X...", "XXXXXXXXXX", "XAAAAAAAAX", "XAAPAAAAAX", "XAAPPAAAAX", "XAAPPPAAAX", "XAAPPAAAAX", "XAAPAAAAAX", "XXXXXXXXXX"];
    const off = ["..X....X..", "...X..X...", "XXXXXXXXXX", "XBABABABAX", "XABABABABX", "XBABABABAX", "XABABABABX", "XBABABABAX", "XABABABABX", "XXXXXXXXXX"];
    art = `<g class="on">${px(on, 220, 70, 16, { X: FG, A: S, P: col })}</g><g class="off">${px(off, 220, 70, 16, { X: FG, A: S, B: DIM })}</g>`;
    css = `.on{animation:on 2.4s steps(1) infinite}@keyframes on{0%{opacity:1}12%{opacity:0}16%,100%{opacity:1}}
.off{opacity:0;animation:off 2.4s steps(1) infinite}@keyframes off{0%{opacity:0}12%{opacity:1}16%,100%{opacity:0}}`;
  } else if (a.art === "map") {
    // A pixel map poster: city blocks, a few streets, one avenue, a river and a park.
    // It prints in row by row, then a pin drops on it.
    const COLS = 24, ROWS = 20, CELL = 9, mx = 300 - (COLS * CELL) / 2, my = 56;
    const r = rng(7);
    const streetRows = [3, 8, 14, 18], streetCols = [4, 10, 15, 20];
    const rows: string[] = [];
    for (let j = 0; j < ROWS; j++) {
      let row = "";
      for (let k = 0; k < COLS; k++) {
        const river = Math.abs(j - (11 + Math.sin(k / 3.2) * 2.4)) < 1.1;
        const avenue = Math.abs(k - (2 + j * 1.05)) < 0.6;
        const park = k >= 16 && k <= 19 && j >= 4 && j <= 7;
        if (river) row += "W";
        else if (park) row += "G";
        else if (streetRows.includes(j) || streetCols.includes(k) || avenue) row += "S";
        else row += r() > 0.45 ? "B" : "b";
      }
      rows.push(row);
    }
    const map = { S: "#CFC9DA", B: "#3A3554", b: "#2E2A44", W: C, G: "#2F9E6B" };
    art = `<rect x="${mx - 10}" y="${my - 10}" width="${COLS * CELL + 20}" height="${ROWS * CELL + 20}" fill="${FG}"/>
<rect x="${mx - 4}" y="${my - 4}" width="${COLS * CELL + 8}" height="${ROWS * CELL + 8}" fill="${BG}"/>
${rows.map((row, j) => `<g class="pr" style="animation-delay:${(j * 0.08).toFixed(2)}s">${px([row], mx, my + j * CELL, CELL, map)}</g>`).join("")}
<g class="pin">${px([".RRR.", "RRWRR", "RRRRR", ".RRR.", "..R.."], mx + 12 * CELL - 10, my + 6 * CELL - 30, 5, { R, W: FG })}</g>`;
    css = `.pr{opacity:0;animation:pr 8s steps(1) infinite}@keyframes pr{0%{opacity:0}2%,88%{opacity:1}100%{opacity:0}}
.pin{opacity:0;animation:pin 8s infinite}@keyframes pin{0%,24%{opacity:0;transform:translateY(-40px)}30%{opacity:1;transform:none}34%{transform:translateY(-8px)}38%,86%{opacity:1;transform:none}90%,100%{opacity:0}}`;
  } else if (a.art === "shelf") {
    const r = rng(19);
    let x = 152, k = 0;
    while (x < 440) {
      const w = (3 + Math.floor(r() * 2)) * 8, h = (9 + Math.floor(r() * 8)) * 8;
      art += `<rect class="bk" style="animation-delay:${(k * 0.2).toFixed(1)}s" x="${x}" y="${260 - h}" width="${w - 4}" height="${h}" fill="${[C, Y, R, FG][k % 4]}"/>`;
      x += w; k++;
    }
    art += `<rect x="136" y="260" width="328" height="16" fill="${DIM}"/>`;
    css = `.bk{animation:dr 6s steps(6) infinite}@keyframes dr{0%{transform:translateY(-220px)}15%,90%{transform:none}100%{transform:none;opacity:0}}`;
  } else {
    // out along a valley, a loop over the top, back home
    const trail = [[0.04, 0.82], [0.14, 0.7], [0.22, 0.74], [0.3, 0.56], [0.4, 0.5], [0.46, 0.32], [0.58, 0.2], [0.7, 0.27], [0.8, 0.14], [0.94, 0.24], [0.9, 0.44], [0.78, 0.52], [0.7, 0.66], [0.56, 0.7], [0.44, 0.8], [0.3, 0.84], [0.16, 0.92], [0.06, 0.86]]
      .map(([u, v]) => [130 + u * 340, 70 + v * 190]);
    const seen = new Set<string>();
    let k = 0;
    for (let j = 0; j < trail.length - 1; j++) for (let t = 0; t < 1; t += 0.08) {
      const gx = Math.round((trail[j][0] + (trail[j + 1][0] - trail[j][0]) * t) / 12) * 12;
      const gy = Math.round((trail[j][1] + (trail[j + 1][1] - trail[j][1]) * t) / 12) * 12;
      if (seen.has(`${gx},${gy}`)) continue;
      seen.add(`${gx},${gy}`);
      art += `<rect class="pt" style="animation-delay:${(k++ * 0.06).toFixed(2)}s" x="${gx}" y="${gy}" width="12" height="12" fill="${col}"/>`;
    }
    css = `.pt{opacity:0;animation:pt 5s steps(1) infinite}@keyframes pt{0%{opacity:0}2%,90%{opacity:1}100%{opacity:0}}`;
  }
  const body = `<rect width="${W}" height="${H}" fill="${BG}"/>
<path d="M30,20H570V330H545V400H55V330H30Z" fill="${S}" stroke="${FG}" stroke-width="4"/>
<rect x="60" y="40" width="480" height="250" fill="${BG}"/>${art}
${T(a.name, 70, 344, 26, "pixel", FG)}
${T(a.line, 72, 382, 30, "vt", FG, "start", 'opacity=".75"')}
${scan(W, H)}`;
  return svg(W, H, body, css, `${a.name}: ${a.line}`);
}

/* ── buttons ── */
function button(label: string, i: number) {
  const w = Math.round(textWidth(label, 15, "pixel") + 64);
  const body = `<rect x="4" y="4" width="${w - 4}" height="56" fill="#000"/><rect width="${w - 4}" height="56" fill="${[Y, C, R][i]}"/>
${T(label, (w - 4) / 2, 36, 15, "pixel", BG, "middle")}`;
  return svg(w, 60, body, "", label);
}

/* ── stats ── */
function stats() {
  const st = JSON.parse(readFileSync(join(ROOT, "data", "stats.json"), "utf8")) as { total: number; longest: number; active: number; days: number; levels: number[]; firstDow: number; top: [string, number][] };
  const pal = [S, "#2F5E5E", "#3A9C9A", C, Y];
  const cells = st.levels.map((lv, i) => {
    const k = i + st.firstDow;
    return `<rect x="${40 + Math.floor(k / 7) * 16}" y="${50 + (k % 7) * 16}" width="12" height="12" fill="${pal[lv]}"/>`;
  }).join("");
  const nums: [string, string][] = [["HI-SCORE", st.total.toLocaleString("en-GB")], ["BEST STREAK", `${st.longest} DAYS`], ["ACTIVE DAYS", `${st.active} / ${st.days}`]];
  let lx = 40;
  const bar = st.top.map(([n, v], i) => {
    const w = Math.max(12, Math.round(((v / 100) * 1120) / 12) * 12);
    const r = `<rect x="${lx}" y="232" width="${w - 4}" height="16" fill="${[C, Y, R, FG, DIM][i]}"/>${v >= 7 ? T(`${n} ${v}%`, lx, 276, 26, "vt", FG) : ""}`;
    lx += w;
    return r;
  }).join("");
  const body = `<rect width="1200" height="300" fill="${BG}"/>${cells}
${nums.map(([l, v], i) => T(l, 910, 66 + i * 60, 14, "pixel", [C, Y, R][i]) + T(v, 910, 96 + i * 60, 22, "pixel", FG)).join("")}
${bar}${scan(1200, 300)}`;
  return svg(1200, 300, body, "", `${st.total} contributions in the last year, longest streak ${st.longest} days, active on ${st.active} of ${st.days} days`);
}

/* ── stack ── */
function stack() {
  const W = ICONS.length * 96;
  const css = `.ic{animation:ju 3s steps(2) infinite}@keyframes ju{0%,80%{transform:none}90%{transform:translateY(-8px)}}`;
  const body = `<rect width="${W}" height="100" fill="${BG}"/>${ICONS.map((ic, i) => `<rect x="${i * 96 + 12}" y="14" width="72" height="72" fill="${S}"/>
<g class="ic" style="animation-delay:${(i * 0.25).toFixed(2)}s"><path d="${ic.path}" transform="translate(${i * 96 + 30} 32) scale(1.5)" fill="${[C, Y, R][i % 3]}"/></g>`).join("")}`;
  return svg(W, 100, body, css, ICONS.map((ic) => ic.title).join(", "));
}

write(OUT, "header.svg", gameHeader());
APPS.forEach((a, i) => write(OUT, `${a.slug}.svg`, cartridge(a, i)));
LINKS.forEach((l, i) => write(OUT, `btn-${l.slug}.svg`, button(l.label, i)));
write(OUT, "stats.svg", stats());
write(OUT, "stack.svg", stack());
console.log("built svg/");
