// Takes a random word from the pool and appends it to 'solution.json'. For
// a brief time around midnight, multiple solutions are served but eventually
// the old solutions are retired by 'retire_solution.js'.

const fs = require('fs')

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

let wordIndex;
const pool = readJson('pool.json');
if (pool.length > 0) {
  const poolIndex = Math.floor((Math.random() * pool.length));
  wordIndex = pool[poolIndex];
  pool.splice(poolIndex, 1);
  writeJson(pool, 'pool.json');
} else {
  const history = readJson('history.json');
  // First year was kinda wonky
  const historyIndices = history.map(entry => entry.index).slice(365);
  const recentlyUsedIndices = historyIndices.slice(-90);
  const historyPoolSet = new Set(historyIndices);
  for (const index of recentlyUsedIndices) {
    historyPoolSet.delete(index);
  }
  const historyPool = [...historyPoolSet];
  const poolIndex = Math.floor((Math.random() * historyPool.length));
  wordIndex = historyPool[poolIndex];
}

// This script is supposed to run every day before midnight in Poland, which
// is GMT+1 or GMT+2, depending on the time of year. We advance the time by 12
// hours to be around noon the following day. This accounts for time zone
// differences and scheduling inconsistencies with a safe margin. Then we advance
// by another 24 hours so that reading the UTC date gives the intended
// expiration date. Note that the local timezone in which this script is
// executed is not defined nor required.
const aroundNoonOnExpirationDayInPL =
  new Date(Date.now() + (12 + 24) * 60 * 60 * 1000);
const expiration =
  aroundNoonOnExpirationDayInPL.getUTCFullYear() + "-" +
  padZeros(aroundNoonOnExpirationDayInPL.getUTCMonth() + 1, 2) + "-" +
  padZeros(aroundNoonOnExpirationDayInPL.getUTCDate(), 2) +
  "T00:00:00+0100"; // TODO: Use proper time zone.

const solutions = readJson('solution.json');
const latestSolution = solutions[solutions.length - 1];
solutions.push({
  id: latestSolution.id + 1,
  index: wordIndex,
  expiration: expiration
});
writeJson(solutions, 'solution.json');
