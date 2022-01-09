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

const pool = readJson('pool.json');
const poolIndex = Math.floor((Math.random() * pool.length));
const wordindex = pool[poolIndex];
pool.splice(poolIndex, 1);
writeJson(pool, 'pool.json');

// This script is supposed to be run every day before midnight in Poland,
// which is UTC+1 or UTC+2 depending on the time of year. By adding 12 hours
// to the current time, we are accounting for the time zone differences and
// schedule inconsistencies with more than a safe margin. When querying the UTC
// date, we will get the tomorrow's day in Poland. 
const tomorrowAroundNoonPL = new Date(Date.now() + 12 * 60 * 60 * 1000);
const expiration =
  tomorrowAroundNoonPL.getUTCFullYear() + "-" +
  padZeros(tomorrowAroundNoonPL.getUTCMonth() + 1, 2) + "-" +
  padZeros(tomorrowAroundNoonPL.getUTCDate(), 2) + " " +
  "GMT+1"; // TODO: Use proper time zone.

const solutions = readJson('solution.json');
solutions.push({
  index: wordindex,
  expiration: expiration
});
writeJson(solutions, 'solution.json');