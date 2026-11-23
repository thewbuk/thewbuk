// The header: name, one line, and a little side-scrolling run underneath.
// A runner crosses the screen on a 12 s loop, jumps two hurdles, collects coins
// (each one pops "+10" and bumps the score), and crosses the finish flag.
// Everything is timed from one clock so the jumps line up with the hurdles.
import { T, svg, textWidth } from "./lib";

const BG = "#111019", FG = "#F4F1E8", Y = "#FFD23F", C = "#3DDBD9", R = "#FF5964", S = "#2A2838", DIM = "#6B6785";
const W = 1200, H = 470, GROUND = 420, CYCLE = 12;
const PX = 6; // sprite pixel size
const X0 = -80, X1 = 1290; // runner travels from X0 to X1 over the whole cycle

const pct = (t: number) => `${(Math.min(Math.max(t, 0), 1) * 100).toFixed(2)}%`;
/** Fraction of the cycle at which the runner's centre is at x. */
const at = (x: number) => (x - 25 - X0) / (X1 - X0);

const px = (cells: string[], x: number, y: number, s: number, map: Record<string, string>) =>
  cells.map((row, j) => [...row].map((ch, i) => (map[ch] ? `<rect x="${x + i * s}" y="${y + j * s}" width="${s}" height="${s}" fill="${map[ch]}"/>` : "")).join("")).join("");

// 10 x 12 runner: H hair, K skin, T shirt, P shorts, S shoes
const RUN = [
  ["...HHH....", "..HHHHH...", "..HKKK....", "..KKKK....", "...TT.....", "..TTTT.K..", ".K.TTTK...", "...PPP....", "..PP.PP...", ".PP...PP..", "SS.....P..", ".......SS."],
  ["...HHH....", "..HHHHH...", "..HKKK....", "..KKKK....", "...TT.....", "..TTTTK...", "..KTTT....", "...PPP....", "...PPP....", "...P.P....", "...P.P....", "...SSS...."],
  ["...HHH....", "..HHHHH...", "..HKKK....", "..KKKK....", "...TT.....", ".KTTTT....", "...TTTK...", "...PPP....", "..PP.PP...", "..P...PP..", ".SS....P..", "......SS.."],
  ["...HHH....", "..HHHHH...", "..HKKK....", "..KKKK....", "...TT.....", "..TTTTK...", "..KTTT....", "...PPP....", "...PPP....", "...P.P....", "...P.P....", "...SSS...."],
];
const JUMP = ["...HHH....", "..HHHHH...", "..HKKK..K.", "..KKKK.K..", "...TTTT...", "..TTTT....", ".K.TT.....", "...PPP....", "..PPPPPP..", ".PP....S..", ".S........", ".........."];
const COLORS = { H: "#3B2A1E", K: "#E8B48A", T: R, P: "#2B3A67", S: FG };

const HURDLES = [440, 880];
const JUMP_HALF = 90, JUMP_H = 100;
// coins: ground coins are collected in stride, air coins at the top of a jump
const COINS: [number, number][] = [[230, 376], [300, 376], [HURDLES[0], 286], [600, 376], [680, 376], [HURDLES[1], 286], [1010, 376], [1080, 376]];
const FLAG = 1150;

export function header() {
  const css: string[] = [];
  let body = `<rect width="${W}" height="${H}" fill="${BG}"/>`;

  // drifting clouds
  const cloud = ["..XXXX....", ".XXXXXXX..", "XXXXXXXXXX", ".XXXXXXXX."];
  body += [[760, 70, 40], [1010, 140, 55], [620, 180, 70]].map(([x, y, d], i) =>
    `<g class="cl${i}" opacity=".18">${px(cloud, x, y, 8, { X: FG })}</g>`).join("");
  css.push([40, 55, 70].map((d, i) => `.cl${i}{animation:cl ${d}s linear infinite;animation-delay:-${i * 13}s}`).join("") +
    `@keyframes cl{from{transform:translateX(260px)}to{transform:translateX(-900px)}}`);

  // name + line
  const lineW = textWidth("Senior full-stack and AI engineer.", 34, "vt");
  body += T("WOJCIECH", 44, 120, 64, "pixel", FG) + T("BANDZEREWICZ", 44, 206, 64, "pixel", Y) +
    T("Senior full-stack and AI engineer.", 48, 262, 34, "vt", C) +
    `<rect class="bl" x="${48 + lineW + 8}" y="254" width="16" height="6" fill="${C}"/>`;
  css.push(`.bl{animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}`);

  // ground
  body += Array.from({ length: W / 16 }, (_, i) => `<rect x="${i * 16}" y="${GROUND}" width="16" height="16" fill="${i % 2 ? "#3A3554" : "#2E2A44"}"/>`).join("");
  body += `<rect x="0" y="${GROUND + 16}" width="${W}" height="${H - GROUND - 16}" fill="#1A1826"/>`;
  // lane marks scrolling under the runner for a sense of speed
  body += `<g class="lane">${Array.from({ length: 40 }, (_, i) => `<rect x="${i * 64}" y="${GROUND + 26}" width="24" height="4" fill="${S}"/>`).join("")}</g>`;
  css.push(`.lane{animation:lane 1.2s linear infinite}@keyframes lane{to{transform:translateX(-64px)}}`);

  // hurdles
  for (const hx of HURDLES) {
    body += `<rect x="${hx - 28}" y="${GROUND - 44}" width="56" height="8" fill="${FG}"/><rect x="${hx - 28}" y="${GROUND - 36}" width="56" height="6" fill="${R}"/>` +
      `<rect x="${hx - 24}" y="${GROUND - 30}" width="6" height="30" fill="${DIM}"/><rect x="${hx + 18}" y="${GROUND - 30}" width="6" height="30" fill="${DIM}"/>`;
  }

  // finish flag (two-frame wave)
  const flagA = ["CCKKCCKK", "KKCCKKCC", "CCKKCCKK", "KKCCKKCC"];
  const flagB = [".CCKKCCK", "KKCCKKCC", "CCKKCCKK", ".KKCCKKC"];
  body += `<rect x="${FLAG}" y="${GROUND - 120}" width="6" height="120" fill="${FG}"/>` +
    `<g class="fa">${px(flagA, FLAG + 6, GROUND - 120, 7, { C: FG, K: "#000" })}</g><g class="fb">${px(flagB, FLAG + 6, GROUND - 120, 7, { C: FG, K: "#000" })}</g>`;
  css.push(`.fa{animation:fa .6s steps(1) infinite}.fb{animation:fa .6s steps(1) infinite reverse}@keyframes fa{0%{opacity:1}50%{opacity:0}}`);

  // coins: spin, then pop with "+10" when the runner reaches them
  COINS.forEach(([cx, cy], i) => {
    const t = at(cx);
    css.push(`.c${i}{animation:c${i} ${CYCLE}s linear infinite}
@keyframes c${i}{0%,${pct(t)}{opacity:1;transform:none}${pct(t + 0.025)}{opacity:0;transform:translateY(-34px)}${pct(0.985)}{opacity:0;transform:none}100%{opacity:1;transform:none}}
.p${i}{opacity:0;animation:p${i} ${CYCLE}s linear infinite}
@keyframes p${i}{0%,${pct(t)}{opacity:0;transform:none}${pct(t + 0.005)}{opacity:1}${pct(t + 0.06)}{opacity:0;transform:translateY(-40px)}100%{opacity:0}}`);
    body += `<g class="c${i}"><g class="spin" style="animation-delay:-${(i * 0.13).toFixed(2)}s"><rect x="${cx - 8}" y="${cy - 10}" width="16" height="20" fill="${Y}"/><rect x="${cx - 4}" y="${cy - 6}" width="4" height="12" fill="#FFF3B0"/></g></g>` +
      `<g class="p${i}">${T("+10", cx, cy - 18, 12, "pixel", Y, "middle")}</g>`;
  });
  css.push(`.spin{animation:spin .9s steps(4) infinite;transform-box:fill-box;transform-origin:center}@keyframes spin{50%{transform:scaleX(.25)}}`);

  // score: one variant per coin count, each shown between two pickups
  const times = COINS.map(([cx]) => at(cx)).sort((a, b) => a - b);
  body += T("SCORE", W - 44 - 150, 56, 14, "pixel", C);
  for (let n = 0; n <= COINS.length; n++) {
    const from = n === 0 ? 0 : times[n - 1], to = n === COINS.length ? 0.985 : times[n];
    css.push(`.s${n}{opacity:0;animation:s${n} ${CYCLE}s steps(1) infinite}
@keyframes s${n}{0%{opacity:${n === 0 ? 1 : 0}}${pct(from)}{opacity:1}${pct(to)}{opacity:0}${n === 0 ? `${pct(0.985)}{opacity:1}` : ""}100%{opacity:${n === 0 ? 1 : 0}}}`);
    body += `<g class="s${n}">${T(String(n * 10).padStart(4, "0"), W - 44, 92, 24, "pixel", FG, "end")}</g>`;
  }
  body += `<rect x="${W - 44 - 150}" y="104" width="14" height="16" fill="${Y}"/>${T("COINS", W - 44 - 128, 120, 12, "pixel", DIM)}`;

  // the runner: horizontal travel, vertical jumps, and run/jump frames
  const jumps = HURDLES.map((hx) => [at(hx - JUMP_HALF), at(hx), at(hx + JUMP_HALF)]);
  css.push(`.rx{animation:rx ${CYCLE}s linear infinite}@keyframes rx{from{transform:translateX(${X0}px)}to{transform:translateX(${X1}px)}}`);
  css.push(`.ry{animation:ry ${CYCLE}s infinite}@keyframes ry{0%{transform:none;animation-timing-function:linear}${jumps.map(([a, m, b]) =>
    `${pct(a)}{transform:none;animation-timing-function:cubic-bezier(.2,.7,.4,1)}${pct(m)}{transform:translateY(-${JUMP_H}px);animation-timing-function:cubic-bezier(.6,0,.8,.3)}${pct(b)}{transform:none;animation-timing-function:linear}`).join("")}100%{transform:none}}`);
  const inAir = (on: boolean) => `0%{opacity:${on ? 0 : 1}}${jumps.map(([a, , b]) => `${pct(a)}{opacity:${on ? 1 : 0}}${pct(b)}{opacity:${on ? 0 : 1}}`).join("")}100%{opacity:${on ? 0 : 1}}`;
  css.push(`.rg{animation:rg ${CYCLE}s steps(1) infinite}@keyframes rg{${inAir(false)}}.jg{opacity:0;animation:jg ${CYCLE}s steps(1) infinite}@keyframes jg{${inAir(true)}}`);
  css.push(RUN.map((_, i) => `.f${i}{opacity:0;animation:f${i} .48s steps(1) infinite}@keyframes f${i}{0%{opacity:0}${(i * 25).toFixed(0)}%{opacity:1}${((i + 1) * 25).toFixed(0)}%{opacity:0}}`).join(""));
  css.push(`.f0{opacity:1}`);
  const top = GROUND - RUN[0].length * PX;
  // landing dust
  jumps.forEach(([, , b], i) => {
    css.push(`.d${i}{opacity:0;animation:d${i} ${CYCLE}s linear infinite}@keyframes d${i}{0%,${pct(b)}{opacity:0;transform:none}${pct(b + 0.003)}{opacity:.8}${pct(b + 0.04)}{opacity:0;transform:translateY(-10px)}100%{opacity:0}}`);
  });
  body += `<g class="rx"><g class="ry">
<g class="rg">${RUN.map((f, i) => `<g class="f${i}">${px(f, 0, top, PX, COLORS)}</g>`).join("")}</g>
<g class="jg">${px(JUMP, 0, top, PX, COLORS)}</g>
</g></g>`;
  body += HURDLES.map((hx, i) => `<g class="d${i}"><rect x="${hx + JUMP_HALF - 26}" y="${GROUND - 8}" width="8" height="8" fill="${DIM}"/><rect x="${hx + JUMP_HALF + 2}" y="${GROUND - 12}" width="6" height="6" fill="${DIM}"/><rect x="${hx + JUMP_HALF + 14}" y="${GROUND - 6}" width="6" height="6" fill="${DIM}"/></g>`).join("");

  // scanlines
  body += `<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity=".28"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, css.join("\n"), "Wojciech Bandzerewicz. Senior full-stack and AI engineer.");
}
