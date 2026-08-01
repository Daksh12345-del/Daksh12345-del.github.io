// Generates data/contributions.json using GitHub's OFFICIAL GraphQL
// contribution calendar (same data your green squares use) instead of
// the unofficial jogruber.de scraper. Runs server-side in a GitHub Action,
// so the streak math happens once, correctly, on a schedule — not live
// in every visitor's browser with all its timezone/caching quirks.

const USERNAME = "Daksh12345-del";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN env var");
  process.exit(1);
}

const query = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, variables: { login: USERNAME } }),
});

if (!res.ok) {
  console.error("GraphQL request failed:", res.status, await res.text());
  process.exit(1);
}

const json = await res.json();
if (json.errors) {
  console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const calendar = json.data.user.contributionsCollection.contributionCalendar;
const days = calendar.weeks
  .flatMap((w) => w.contributionDays)
  .map((d) => ({ date: d.date, count: d.contributionCount }));

const total = calendar.totalContributions;

// ---- longest streak (anywhere in range) ----
let longest = { length: 0, start: null, end: null };
{
  let runStart = null, runLen = 0;
  for (const d of days) {
    if (d.count > 0) {
      if (runLen === 0) runStart = d.date;
      runLen++;
      if (runLen > longest.length) longest = { length: runLen, start: runStart, end: d.date };
    } else {
      runLen = 0;
    }
  }
}

// ---- current streak (ending today, or yesterday if today has 0 so far) ----
let current = { length: 0, start: null, end: null };
{
  const todayStr = new Date().toISOString().slice(0, 10);
  let idx = days.length - 1;
  // Skip a trailing "today" entry that's still 0 — the day isn't over yet,
  // it shouldn't count as a broken streak.
  while (idx >= 0 && days[idx].date >= todayStr && days[idx].count === 0) idx--;

  let len = 0, end = idx >= 0 ? days[idx].date : null, start = end;
  for (let i = idx; i >= 0; i--) {
    if (days[i].count > 0) {
      len++;
      start = days[i].date;
    } else {
      break;
    }
  }
  current = { length: len, start: len ? start : null, end: len ? end : null };
}

// ---- best single day ----
let bestDay = { date: null, count: -1 };
for (const d of days) {
  if (d.count > bestDay.count) bestDay = { date: d.date, count: d.count };
}

const output = {
  username: USERNAME,
  generated_at: new Date().toISOString(),
  range: { start: days[0]?.date ?? null, end: days[days.length - 1]?.date ?? null },
  total_contributions: total,
  current_streak: current,
  longest_streak: longest,
  best_day: bestDay,
  days,
};

const fs = await import("node:fs/promises");
await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/contributions.json", JSON.stringify(output), "utf-8");
console.log(`Wrote data/contributions.json — total: ${total}, current streak: ${current.length}, longest streak: ${longest.length}`);
