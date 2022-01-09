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
const keyboardKeyElements = [];
let successfulAttemptIndex = null;
let currentAttemptIndex = 0;
let currentLetterIndex = 0;
let solution = null;

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
    row.element.classList.add('letter-row');
    
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

      cell = {
        element: cellElement,
        frameElement: frameElement,
        committedElement: committedElement,
      }
      
      row.element.append(cell.element);
      row.cells.push(cell);
    }
    
    letterGrid.element.append(row.element);
    letterGrid.rows.push(row);
  }
  
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
};

function everySecond() {
  const millisLeft = solution.expiration - Date.now();
  if (millisLeft <= 0) {
    location.reload();
  } else {
    countdownElement.textContent = new Date(millisLeft).toTimeString().slice(0, 8);
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
    	commitCurrentWord();
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

function commitCurrentWord() {
  let word = "";
  const row = letterGrid.rows[currentAttemptIndex];
  for (let j = 0; j < WORD_LENGTH; ++j) {
    word += row.cells[j].frameElement.textContent;
  }

  if (!WORDS.includes(word)) {
    showToast('Słowo "' + word + '" nie występuje w słowniku');
    return;
  }

  const solutionLetters =  solution.word.split('');
  let matchCount = 0;

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.frameElement.textContent;
    if (letter ==  solution.word[j]) {
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

  if (matchCount == WORD_LENGTH) {
    successfulAttemptIndex = currentAttemptIndex;
    currentAttemptIndex = ATTEMPT_COUNT;
  } else {
    ++currentAttemptIndex;
    currentLetterIndex = 0;
    if (currentAttemptIndex == ATTEMPT_COUNT) {
      successfulAttemptIndex = -1;
    }
  }

  const attemptIndex = currentAttemptIndex;
  applyLetterStatuses(row, function () {
    if (matchCount == WORD_LENGTH || attemptIndex == ATTEMPT_COUNT) {
      showStatsPopup();
    }
  });
}

function applyLetterStatuses(row, callback) {
  const keyCells = {};

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.frameElement.textContent;
    cell.committedElement.textContent = letter;

    if (
        !(letter in keyCells) ||
        statusPriority(cell.status) > statusPriority(keyCells[letter].status)) {
      keyCells[letter] = cell;
    }

    setTimeout(function () {
      cell.element.setAttribute('status', cell.status);
      if (keyCells[letter] === cell) {
        const keyElement = getKeyboardKeyElement(letter);
        keyElement.setAttribute('status', cell.status);
      }
    }, j * 300);
  }
  setTimeout(callback, (WORD_LENGTH - 1) * 300 + 2000);
}

function loadSolution(callback) {
  let callbackCalled = false;
  const guardedCallback = function (candidate) {
    if (callbackCalled) {
      return;
    }
    callbackCalled = true;

    if (candidate) {
      solution = {
        word: WORDS[candidate.index],
        expiration: candidate.expiration
      };
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
      statsPopupMessageElement.textContent = "Brawo! Liczba ruchów: " + (successfulAttemptIndex + 1);
    } else {
      statsPopupMessageElement.textContent = "Niestety nie udało się tym razem";
    }
  }
  statsPopupMessageElement
  showPopup('stats');
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