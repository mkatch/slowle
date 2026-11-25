// Maintains 'solution.json' so that it contains the solution for the current
// day and for DAYS_IN_ADVANCE following days. Expired solutions are moved to
// 'history.json' and missing future solutions are picked from the pool.
//
// The script is idempotent: running it multiple times on the same day doesn't
// change anything after the first run. This allows it to be scheduled with
// generous margins and triggered manually at any time.

const fs = require('fs')

const DAYS_IN_ADVANCE = 5;
const TIME_ZONE = 'Europe/Warsaw';

function readJson(filename) {
  const json = fs.readFileSync(filename, 'utf8');
  return JSON.parse(json);
}

function writeJson(object, filename) {
  fs.writeFileSync(filename, JSON.stringify(object, null, 2));
}

function padZeros(value, length) {
  return ('0'.repeat(length) + value).slice(-length);
}

// Formats the date in Poland which is 'daysFromToday' days after today, as an
// expiration timestamp, i.e. midnight at the beginning of that day. Note that
// the local timezone in which this script is executed is not defined nor
// required.
function expirationInDays(now, daysFromToday) {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + daysFromToday));
  // DST transitions in Poland happen at 2:00 or 3:00 local time, so midnight
  // UTC of the given date has the same offset as midnight in Poland.
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, timeZoneName: 'longOffset'
  }).formatToParts(date).find(part => part.type == 'timeZoneName').value;
  return date.getUTCFullYear() + "-" +
    padZeros(date.getUTCMonth() + 1, 2) + "-" +
    padZeros(date.getUTCDate(), 2) +
    "T00:00:00" + offset.replace('GMT', '');
}

function pickWordIndex(pool, history, solutions) {
  if (pool.length > 0) {
    const poolIndex = Math.floor((Math.random() * pool.length));
    const wordIndex = pool[poolIndex];
    pool.splice(poolIndex, 1);
    return wordIndex;
  }

  // First year was kinda wonky
  const historyIndices = history.map(entry => entry.index).slice(365);
  const recentlyUsedIndices = historyIndices.slice(-90)
    .concat(solutions.map(entry => entry.index));
  const historyPoolSet = new Set(historyIndices);
  for (const index of recentlyUsedIndices) {
    historyPoolSet.delete(index);
  }
  const historyPool = [...historyPoolSet];
  const poolIndex = Math.floor((Math.random() * historyPool.length));
  return historyPool[poolIndex];
}

const now = Date.now();
const pool = readJson('pool.json');
const history = readJson('history.json');
const allSolutions = readJson('solution.json');

allSolutions.sort((a, b) => a.id - b.id);
const expiredSolutions = allSolutions.filter(
  entry => Date.parse(entry.expiration) <= now);
const solutions = allSolutions.filter(
  entry => Date.parse(entry.expiration) > now);
history.push(...expiredSolutions);

let addedCount = 0;
// Today's solution expires at the beginning of tomorrow.
for (let days = 1; days <= 1 + DAYS_IN_ADVANCE; ++days) {
  const expiration = expirationInDays(now, days);
  const latestSolution =
    solutions.length > 0 ? solutions[solutions.length - 1]
                         : history[history.length - 1];
  if (Date.parse(expiration) <= Date.parse(latestSolution.expiration)) {
    continue;
  }
  solutions.push({
    id: latestSolution.id + 1,
    index: pickWordIndex(pool, history, solutions),
    expiration: expiration
  });
  ++addedCount;
}

if (expiredSolutions.length > 0) {
  writeJson(history, 'history.json');
}
if (expiredSolutions.length > 0 || addedCount > 0) {
  writeJson(solutions, 'solution.json');
  writeJson(pool, 'pool.json');
}
