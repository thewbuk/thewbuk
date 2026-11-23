// Fetches the numbers for svg/stats.svg into data/stats.json.
// Needs GITHUB_TOKEN (the Actions token is enough). Locally: GITHUB_TOKEN=$(gh auth token) bun scripts/stats.ts
import { write } from "./lib";
import { join } from "node:path";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN missing");
const login = process.env.PROFILE_LOGIN ?? "thewbuk";

const q = `query($login:String!){user(login:$login){
  contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}
  repositories(ownerAffiliations:OWNER,first:100){totalCount nodes{isFork languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
}}`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "thewbuk-profile" },
  body: JSON.stringify({ query: q, variables: { login } }),
});
const json: any = await res.json();
if (!json.data?.user) throw new Error(JSON.stringify(json));
const u = json.data.user;
const cal = u.contributionsCollection.contributionCalendar;
const days: { date: string; contributionCount: number; contributionLevel: string }[] = cal.weeks.flatMap((w: any) => w.contributionDays);
const LEVEL: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount ? run + 1 : 0; longest = Math.max(longest, run); }

const bytes: Record<string, number> = {};
for (const r of u.repositories.nodes) {
  if (r.isFork) continue;
  for (const e of r.languages.edges) bytes[e.node.name] = (bytes[e.node.name] ?? 0) + e.size;
}
const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
const top = Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => [n, Math.round((v / total) * 100)]);

const stats = {
  total: cal.totalContributions,
  longest,
  repos: u.repositories.totalCount,
  levels: days.map((d) => LEVEL[d.contributionLevel] ?? 0),
  firstDow: new Date(days[0].date).getUTCDay(),
  top,
};
write(join(import.meta.dir, "..", "data"), "stats.json", JSON.stringify(stats, null, 1) + "\n");
console.log(`contributions ${stats.total}, longest streak ${longest}, repos ${stats.repos}, top ${JSON.stringify(top)}`);
