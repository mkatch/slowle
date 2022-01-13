const WORD_LENGTH = 5;
const ATTEMPT_COUNT = 6;
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ['Ą', 'Ć', 'Ę', 'Ł', 'Ó', 'Ś', 'Ź', 'Ż'],
];
const WIDE_KEYS = ['ENTER', '⌫'];

const letterGrid = {
  rows: [],
}
let exampleAttemptRow = null;
let exampleSolutionRow = null;
const keyboardKeyElements = [];
let successfulAttemptIndex = null;
let currentAttemptIndex = 0;
let currentLetterIndex = 0;
let solution = null;
let progress = null;

window.onload = function () {
  loadSolution(initializeGame);
};

function initializeGame() {
  letterGrid.element = letterGridElement;

	for (let i = 0; i < ATTEMPT_COUNT; ++i) {
  	const row = {
    	element: document.createElement('div'),
      cells: [],
    };
    initializeRow(row);
    
    letterGrid.element.append(row.element);
    letterGrid.rows.push(row);
  }

  const exampleSolutionWord = exampleSolutionRowElement.textContent;
  exampleAttemptRow = {
    element: exampleAttemptRowElement,
    cells: [],
    isExample: true,
  }
  initializeRow(exampleAttemptRow);
  checkRow(exampleAttemptRow, exampleSolutionWord);
  exampleSolutionRow = {
    element: exampleSolutionRowElement,
    cells: [],
    isExample: true,
  }
  initializeRow(exampleSolutionRow);
  checkRow(exampleSolutionRow, exampleSolutionWord);
  
  for (let i = 0; i < KEYBOARD_ROWS.length; ++i) {
  	const keyboardRow = KEYBOARD_ROWS[i];
    const rowElement = document.createElement('div');
    rowElement.classList.add('keyboard-row');
    
    for (let j = 0; j < keyboardRow.length; ++j) {
    	keyElement = document.createElement('div');
      keyElement.classList.add('keyboard-key');
      keyElement.onclick = onKeyClick;
      
      const key = keyboardRow[j];
      keyElement.textContent = key;
      if (WIDE_KEYS.includes(keyboardRow[j])) {
      	keyElement.classList.add('wide');
      }
      
      rowElement.append(keyElement);
      keyboardKeyElements.push(keyElement);
    }
    
    keyboardElement.append(rowElement);
  }

  setInterval(everySecond, 1000);

  window.onresize = onWindowResize;
  window.onkeydown = onWindowKeyDown;
  
  onWindowResize();

  loadProgress();
  loadSettings();
};

function initializeRow(row) {
  row.element.classList.add('letter-row');
  
  const word = row.element.textContent;
  if (word) {
    console.log(word);
    row.element.textContent = null;
  }

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cellElement = document.createElement('div');
    cellElement.classList.add('letter-cell');

    const contentElement = document.createElement('div');
    contentElement.classList.add('content');
    cellElement.append(contentElement);

    const frameElement = document.createElement('div');
    frameElement.classList.add('letter-frame');
    contentElement.append(frameElement);

    const committedElement = document.createElement('div');
    committedElement.classList.add('committed-letter');
    contentElement.append(committedElement);

    if (word) {
      frameElement.textContent = word[j];
    }

    const cell = {
      element: cellElement,
      frameElement: frameElement,
      committedElement: committedElement,
    }
    
    row.element.append(cell.element);
    row.cells.push(cell);
  }
}

function everySecond() {
  const millisLeft = solution.expiration - Date.now();
  if (millisLeft <= 0) {
    location.reload();
  } else {
    const timeLeft = new Date(millisLeft);
    countdownElement.textContent =
      padZeros(timeLeft.getUTCHours(), 2) + ":" +
      padZeros(timeLeft.getUTCMinutes(), 2) + ":" +
      padZeros(timeLeft.getUTCSeconds(), 2);
  }
}

function onWindowResize() {
	const boardRect = boardElement.getBoundingClientRect();
  const maxCellWidth = Math.floor(boardRect.width / WORD_LENGTH);
  const maxCellHeight = Math.floor(boardRect.height / ATTEMPT_COUNT);
  const cellSize = Math.min(maxCellWidth, maxCellHeight) + 'px';
  for (let i = 0; i < ATTEMPT_COUNT; ++i) {
  	const row = letterGrid.rows[i];
  	for (let j = 0; j < WORD_LENGTH; ++j) {
    	const cellElement = row.cells[j].element;
      cellElement.style.width = cellSize;
      cellElement.style.height = cellSize;
    }
  }
}

function onWindowKeyDown(e) {
	if (e.keyCode == 13) {
    onKey('ENTER');
  } else if (e.keyCode == 8) {
    onKey('⌫');
  } else {
    onKey(e.key.toUpperCase());
  }
};

function onKeyClick(e) {
  onKey(e.target.textContent);
}

function onKey(key) {
	if (currentAttemptIndex >= ATTEMPT_COUNT) {
  	return;
  }
  if (popupOverlayElement.hasAttribute('which')) {
    return;
  }
  
  let supported = false;
  for (let i = 0; i < KEYBOARD_ROWS.length; ++i) {
    if (KEYBOARD_ROWS[i].includes(key)) {
      supported = true;
      break;
    }
  }
  if (!supported) {
    return;
  }
  
  if (key == 'ENTER') {
  	if (currentLetterIndex == WORD_LENGTH) {
    	commitCurrentAttempt();
    } else {
      showToast('Wpisz 5-literowe słowo');
    }
  } else if (key == '⌫') {
    if (currentLetterIndex > 0) {
      --currentLetterIndex;
  		const cell = letterGrid.rows[currentAttemptIndex].cells[currentLetterIndex];
    	cell.frameElement.innerText = '';
    }
  } else if (currentLetterIndex < WORD_LENGTH) {
  	const cell = letterGrid.rows[currentAttemptIndex].cells[currentLetterIndex];
  	cell.frameElement.innerText = key;
    ++currentLetterIndex;
  }
}

function commitCurrentAttempt() {
  let word = "";
  const row = letterGrid.rows[currentAttemptIndex];
  for (let j = 0; j < WORD_LENGTH; ++j) {
    word += row.cells[j].frameElement.textContent;
  }

  if (!WORDS.includes(word)) {
    showToast('Słowo "' + word + '" nie występuje w słowniku');
    return null;
  }

  progress.attempts[currentAttemptIndex] = word;
  saveProgress();
  
  checkCurrentAttempt();

  const callback = (successfulAttemptIndex != null) ? showStatsPopup : null;
  animateAttemptStatus(row, callback);
}

function checkRow(row, solutionWord) {
  const solutionLetters = solutionWord.split('');
  let matchCount = 0;

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.frameElement.textContent;
    if (letter ==  solutionWord[j]) {
      cell.status = 'match';
      ++matchCount;
      solutionLetters.splice(solutionLetters.indexOf(letter), 1);
    } else {
      delete cell.status; 
    }
  }

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    if (cell.status) {
      continue;
    }
    const letter = cell.frameElement.textContent;
    if (solutionLetters.includes(letter)) {
      cell.status = 'partial';
      solutionLetters.splice(solutionLetters.indexOf(letter), 1);
    } else {
      cell.status = 'miss';
    }
  }

  return matchCount == WORD_LENGTH;
}

function checkCurrentAttempt() {
  const match = checkRow(letterGrid.rows[currentAttemptIndex], solution.word);

  if (match) {
    successfulAttemptIndex = currentAttemptIndex;
    currentAttemptIndex = ATTEMPT_COUNT;
  } else {
    ++currentAttemptIndex;
    currentLetterIndex = 0;
    if (currentAttemptIndex >= ATTEMPT_COUNT) {
      successfulAttemptIndex = -1;
    }
  }
}

function animateAttemptStatus(row, callback, interval = 300) {
  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.frameElement.textContent;
    cell.committedElement.textContent = letter;

    setTimeout(function () {
      cell.element.setAttribute('status', cell.status);
      if (!row.isExample) {
        const keyElement = getKeyboardKeyElement(letter);
        if (
            statusPriority(cell.status) >
            statusPriority(keyElement.getAttribute('status'))) {
          keyElement.setAttribute('status', cell.status);
        }
      }
    }, j * interval);
  }

  if (callback) {
    setTimeout(callback, (WORD_LENGTH - 1) * interval + 1000);
  }
}

function loadProgress() {
  progress = localStorage.getItem('progress');
  if (progress) {
    progress = JSON.parse(progress);
  }
  if (!progress || progress.solutionId != solution.id) {
    progress = {
      solutionId: solution.id,
      attempts: [],
    }
    saveProgress();
  }

  for (let i = 0; i < progress.attempts.length; ++i) {
    const row = letterGrid.rows[i];
    const word = progress.attempts[i];
    for (let j = 0; j < WORD_LENGTH; ++j) {
      row.cells[j].frameElement.textContent = word[j];
    }
    checkCurrentAttempt();
    const callback = (successfulAttemptIndex != null) ? showStatsPopup : null;
    setTimeout(function () { animateAttemptStatus(row, callback, 50); }, i * 200);
  }
}

function saveProgress() {
  localStorage.setItem('progress', JSON.stringify(progress));
}

function loadSettings() {
  settings = localStorage.getItem('settings');
  if (settings) {
    settings = JSON.parse(settings);
  } else {
    settings = {}
    saveSettings();
    showAboutPopup();
  }
}

function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(settings));
}

function loadSolution(callback) {
  let callbackCalled = false;
  const guardedCallback = function (candidate) {
    if (callbackCalled) {
      return;
    }
    callbackCalled = true;

    if (candidate) {
      solution = candidate;
      solution.word = WORDS[candidate.index];
      callback();
    } else {
      solution = null;
      showToast("Nie można załadować słowa. Spróbuj ponownie później.")
    }
  }
  const failureCallback = function () { guardedCallback(null); }

  const request = new XMLHttpRequest();
  // Adding timestamp query parameter to prevent caching.
  request.open('GET', "solution.json" + "?t=" + Date.now(), true);
  request.timeout = 5000;
  request.onerror = failureCallback;
  request.ontimeout = failureCallback;

  request.onload = function () {
    const now = Date.now();
    const candidates = JSON.parse(request.responseText);
    for (let i = 0; i < candidates.length; ++i) {
      const candidate = candidates[i];
      candidate.expiration = Date.parse(candidate.expiration);
      if (now <= candidate.expiration) {
        guardedCallback(candidate);
        return;
      }
    }
    failureCallback();
  }

  request.send(null);
}

function getKeyboardKeyElement(letter) {
  for (let i = 0; i < keyboardKeyElements.length; ++i) {
    const element = keyboardKeyElements[i];
    if (element.textContent == letter) {
      return element;
    }
  }
  return null;
}

function share() {
  if (successfulAttemptIndex == null || successfulAttemptIndex < 0) {
    return;
  }
  
  let data = "Słowle " + solution.id + " "
    + (successfulAttemptIndex + 1) + "/" +  ATTEMPT_COUNT + "\n";
  for (let i = 0; i <= successfulAttemptIndex; ++i) {
    const row = letterGrid.rows[i];
    data += "\n";
    for (let j = 0; j < WORD_LENGTH; ++j) {
      const status = row.cells[j].status;
      if (status == 'match') {
        data += "🟩";
      } else if (status == 'partial') {
        data += "🟨";
      } else {
        data += "⬛";
      }
    }
  }
  
  try {
    navigator.share({text: data});
  } catch (_) {
    navigator.clipboard.writeText(data);
    showToast("Skopiowano do schowka");
  }
}

function showToast(message) {
  toastElement.children[0].textContent = message;
  toastElement.classList.add('visible');
  const tag = Object();
  toastElement.tag = tag;
  setTimeout(function () {
    if (toastElement.tag === tag) {
      toastElement.classList.add('opacity0');
      setTimeout(function () {
        if (toastElement.tag === tag) {
          toastElement.classList.remove('visible');
        }
      }, 200);
    }
  }, 3000);

  toastElement.classList.add('opacity0');
  window.requestAnimationFrame(function () {
    if (toastElement.tag === tag) {
      toastElement.classList.remove('opacity0');
    }
  });
}

function showPopup(which) {
  popupOverlayElement.setAttribute('which', which);
}

function hidePopup() {
  popupOverlayElement.removeAttribute('which');
}

function showStatsPopup() {
  if (successfulAttemptIndex != null) {
    if (successfulAttemptIndex >= 0) {
      statsPopupVerdictElement.textContent = "Brawo! Liczba ruchów: " + (successfulAttemptIndex + 1);
    } else {
      statsPopupVerdictElement.textContent = "Niestety nie udało się tym razem";
    }
    statsPopupSolutionElement.textContent += "Rozwiązanie: \"" + solution.word + "\"";
  }
  showPopup('stats');
}

function showAboutPopup() {
  showPopup('about');
  setTimeout(function () { animateAttemptStatus(exampleAttemptRow); }, 200);
  setTimeout(function () { animateAttemptStatus(exampleSolutionRow); }, 800);
}

function padZeros(value, length) {
  return ('0'.repeat(length) + value).slice(-length);
}

function statusPriority(status) {
  if (status == 'match') {
    return 3;
  } else if (status == 'partial') {
    return 2;
  } else if (status == 'miss') {
    return 1;
  } else {
    return 0;
  }
}