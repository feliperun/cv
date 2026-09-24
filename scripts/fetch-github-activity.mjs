#!/usr/bin/env node

// Snapshot the GitHub contribution calendar into assets/github-activity.json.
// The resume build (and its CI job) stays offline: it only reads this file.
// Refresh locally with `npm run activity` (needs an authenticated `gh`).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LOGIN = 'feliperun';
const output = fileURLToPath(new URL('../assets/github-activity.json', import.meta.url));

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const query = `{
  user(login: "${LOGIN}") {
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const raw = execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8' });
const collection = JSON.parse(raw).data.user.contributionsCollection;
const calendar = collection.contributionCalendar;
const days = calendar.weeks.flatMap(week => week.contributionDays);

const snapshot = {
  login: LOGIN,
  from: days[0].date,
  to: days.at(-1).date,
  total: calendar.totalContributions,
  // Contributions to repositories a visitor cannot open (private company repos).
  private: collection.restrictedContributionsCount,
  // One array per week (Sunday first), one [count, level 0-4] pair per day.
  weeks: calendar.weeks.map(week =>
    week.contributionDays.map(day => [day.contributionCount, LEVELS[day.contributionLevel]])),
};

writeFileSync(output, `${JSON.stringify(snapshot)}\n`);
console.log(`${output}: ${snapshot.total} contributions, ${snapshot.from} → ${snapshot.to}`);
