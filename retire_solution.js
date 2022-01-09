// Removes all but latest solution from 'solution.json' and appends them to
// 'history.json'. During normal operation, 'solution.json' should have two
// entries at the time this script is executed.

const fs = require('fs')

function readJson(filename) {
  const json = fs.readFileSync(filename, 'utf8');
  return JSON.parse(json);
}

function writeJson(object, filename) {
  fs.writeFileSync(filename, JSON.stringify(object, null, 2));
}

const solutions = readJson('solution.json');
const history = readJson('history.json');

let latestIndex = 0;
let latestExpiration = 0;
for (let i = 0; i < solutions.length; ++i) {
  const expiration = Date.parse(solutions[i].expiration);
  if (expiration >= latestExpiration) {
    latestIndex = i;
    latestExpiration = expiration;
  }
}

for (let i = 0; i < solutions.length; ++i) {
  if (i != latestIndex) {
    history.push(solutions[i]);
  }
}

writeJson(history, 'history.json');
writeJson([solutions[latestIndex]], 'solution.json');