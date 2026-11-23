// Draws assets/activity-{dark,light}.svg from the GitHub contribution calendar.
// Runs daily in .github/workflows/activity.yml. Locally: GITHUB_TOKEN=$(gh auth token) bun scripts/activity.ts
import { THEMES, Theme, T, svg, write, ASSETS, textWidth } from "./lib";

const LOGIN = process.env.PROFILE_LOGIN ?? "thewbuk";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN missing");

const q = `query($login:String!){user(login:$login){
  contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}
  repositories(ownerAffiliations:OWNER){totalCount}
}}`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-activity" },
  body: JSON.stringify({ query: q, variables: { login: LOGIN } }),
});
const json: any = await res.json();
if (!json.data) throw new Error(JSON.stringify(json));
const cal = json.data.user.contributionsCollection.contributionCalendar;
const weeks: { date: string; contributionCount: number; contributionLevel: string }[][] = cal.weeks.map((w: any) => w.contributionDays);
const days = weeks.flat();
const LEVEL: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue; // today not done yet
  else break;
}
const activeDays = days.filter((d) => d.contributionCount > 0).length;
const best = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a));
const fmt = (n: number) => n.toLocaleString("en-GB");

function draw(th: Theme) {
  const W = 1200, cell = 13, gap = 3, gx = 48, gy = 64;
  const gridW = weeks.length * (cell + gap);
  const H = gy + 7 * (cell + gap) + 76;
  const cyc = 8;
  const css = `
.c{animation:c ${cyc}s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes c{0%,2%{transform:scale(1)}6%{transform:scale(1.45)}12%,100%{transform:scale(1)}}
.sweep{animation:sw ${cyc}s linear infinite}
@keyframes sw{0%{transform:translateX(0);opacity:0}2%{opacity:1}40%{transform:translateX(${gridW}px);opacity:1}42%,100%{transform:translateX(${gridW}px);opacity:0}}
.count{animation:in 1.2s cubic-bezier(.2,.8,.2,1) both}@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
  const months: string[] = [];
  let lastM = -1;
  weeks.forEach((w, i) => {
    const m = new Date(w[0].date).getUTCMonth();
    if (m !== lastM && i < weeks.length - 2) {
      lastM = m;
      months.push(T(new Date(w[0].date).toLocaleString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase(), gx + i * (cell + gap), gy - 14, 9.5, { font: "mono", fill: th.muted, tracking: 0.1 }));
    }
  });
  const cells = weeks.map((w, wi) => w.map((d) => {
    const dow = new Date(d.date).getUTCDay();
    const lvl = LEVEL[d.contributionLevel] ?? 0;
    const delay = ((wi / weeks.length) * cyc * 0.4).toFixed(2);
    return `<rect${lvl ? ` class="c" style="animation-delay:${delay}s"` : ""} x="${gx + wi * (cell + gap)}" y="${gy + dow * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${th.heat[lvl]}"/>`;
  }).join("")).join("");
  const sx = gx + gridW + 40;
  const stats: [string, string][] = [
    [fmt(cal.totalContributions), "CONTRIBUTIONS"],
    [`${longest}d`, "LONGEST STREAK"],
    [fmt(activeDays), "ACTIVE DAYS"],
    [`${current}d`, "CURRENT STREAK"],
  ];
  const colW = (W - 48 - sx) / 2;
  const body = `
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${th.panel}" stroke="${th.line}"/>
${months.join("")}
${cells}
<g class="sweep"><rect x="${gx - 4}" y="${gy - 6}" width="2" height="${7 * (cell + gap) + 8}" fill="${th.acc}"/></g>
${stats.map(([v, l], i) => {
  const x = sx + (i % 2) * colW, y = gy + 34 + Math.floor(i / 2) * 64;
  return `<g>${T(v, x, y, 34, { fill: i === 0 ? th.acc : th.text, tracking: -0.02 })}${T(l, x, y + 20, 9.5, { font: "mono", fill: th.muted, tracking: 0.14 })}</g>`;
}).join("")}
${T("LESS", gx, H - 30, 9.5, { font: "mono", fill: th.muted, tracking: 0.12 })}
${th.heat.map((c, i) => `<rect x="${gx + 40 + i * 17}" y="${H - 40}" width="13" height="13" rx="3" fill="${c}"/>`).join("")}
${T("MORE", gx + 40 + 5 * 17 + 6, H - 30, 9.5, { font: "mono", fill: th.muted, tracking: 0.12 })}
${T(`BUSIEST DAY ${new Date(best.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).toUpperCase()} · ${best.contributionCount} CONTRIBUTIONS · UPDATED ${new Date().toISOString().slice(0, 10)}`, W - 48, H - 30, 9.5, { font: "mono", fill: th.dim, align: "end", tracking: 0.12 })}`;
  return svg(W, H, body, css, `${cal.totalContributions} contributions in the last year`);
}

for (const th of THEMES) write(ASSETS, `activity-${th.name}.svg`, draw(th));
console.log(`total ${cal.totalContributions}, longest ${longest}, current ${current}, active ${activeDays}`);
