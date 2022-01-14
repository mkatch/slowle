class BoardCell {
  constructor(row, columnIndex) {
    this.element = document.createElement('div');
    this.element.classList.add('cell', 'hehe');
    this.element.style.gridArea = (row.index + 1) + " / " + (columnIndex + 1);

    this.frontFaceElement = document.createElement('div');
    this.frontFaceElement.classList.add('front-face');
    this.element.append(this.frontFaceElement);

    this.inputTileElement = document.createElement('div');
    this.inputTileElement.classList.add('input', 'tile');
    this.frontFaceElement.append(this.inputTileElement);

    this.inputElement = document.createElement('span');
    this.inputTileElement.append(this.inputElement);

    this.inputTileLowerBorderElement = document.createElement('div');
    this.inputTileLowerBorderElement.classList.add('lower', 'border');
    this.inputTileElement.append(this.inputTileLowerBorderElement);

    this.inputTileTopBorderElement = document.createElement('div');
    this.inputTileTopBorderElement.classList.add('top', 'border');
    this.inputTileElement.append(this.inputTileTopBorderElement);

    this.statusTileElement = document.createElement('div');
    this.statusTileElement.classList.add('status', 'tile');
    this.frontFaceElement.append(this.statusTileElement);

    this.letter = null;
  }

  get letter() { return this._letter; }

  set letter(value) {
    if (value) {
      this._letter = value;
      this.element.classList.remove('empty');
      this.inputElement.textContent = value;
      this.statusTileElement.textContent = value;
    } else {
      this._letter = null;
      this.element.classList.add('empty');
      this.inputElement.textContent = "";
      this.statusTileElement.textContent = "";
    }
  }

  set isCurrent(value) {
    if (value) {
      this.element.classList.add('current');
    } else {
      this.element.classList.remove('current');
    }
  }

  get hasCommittedStyle() { return this.element.hasAttribute('status'); }

  set layout(value) {
    this._layout = value;
    this.inputTileLowerBorderElement.style.borderWidth =
      value.inputTileBorderWidthStyle;
    this.inputTileTopBorderElement.style.borderWidth =
      value.inputTileBorderWidthStyle;
    this.frontFaceElement.style.transform = value.frontFaceTransformStyle;
    this._applyConditionalLayout();
  }

  applyCommittedStyle() {
    this.element.setAttribute('status', this.status);
    this._applyConditionalLayout();
  }

  _applyConditionalLayout() {
    if (this.hasCommittedStyle) {
      this.element.style.transform = this._layout.committedTransformStyle;
    } else {
      this.element.style.transform = this._layout.pendingTransformStyle;
    }
  }

  static computeLayout(size) {
    const halfSizeStyle = (size / 2) + "px";
    return {
      inputTileBorderWidthStyle: Math.round(0.05 * size) + 'px',
      pendingTransformStyle: "translateZ(-" + halfSizeStyle + ") rotateX(0)",
      committedTransformStyle:
        "translateZ(-" + halfSizeStyle + ") rotateX(-90deg)",
      frontFaceTransformStyle: "translateZ(" + halfSizeStyle + ")",
    };
  }
}

class BoardRow {
  constructor(board, index) {
    this.board = board;
    this.index = index;

    this.cells = [];
    for (let j = 0; j < this.board.columnCount; ++j) {
      this.cells.push(new BoardCell(this, j));
    }
  }
}

class Board {
  constructor(containerElement, columnCount, rowCount) {
    this.containerElement = containerElement;
    this.columnCount = columnCount;
    this.rowCount = rowCount;

    this.element = document.createElement('div');
    this.element.classList.add('board');
    this.containerElement.append(this.element);

    this.rows = [];
    for (let i = 0; i < this.rowCount; ++i) {
      this.rows.push(new BoardRow(this, i));
    }

    const appendRowElements = (i) => {
      const row = this.rows[i];
      for (let j = 0; j < row.cells.length; ++j) {
        this.element.append(row.cells[j].element);
      }
    }
    for (let i0 = 0, i1 = this.rowCount - 1; i0 <= i1; ++i0, --i1) {
      appendRowElements(i0);
      if (i0 != i1) {
        appendRowElements(i1);
      }
    }
  }

  static example(containerElement) {
    const word = containerElement.textContent;
    containerElement.textContent = "";
    const board = new Board(containerElement, word.length, 1);
    for (let j = 0; j < word.length; ++j) {
      board.rows[0].cells[j].letter = word[j];
    }
    board.isExample = true;
    board.word = word;
    return board;
  }

  layOut() {
    const rect = this.containerElement.getBoundingClientRect();

    // "Step" is the grid cell size together with the gap. For simplicity of
    // computation we assume there is as many gaps as there are cells, although
    // in reality it's one less.
    const maxStepX = Math.floor(rect.width / this.columnCount);
    const maxStepY = Math.floor(rect.height / this.rowCount);
    const step = Math.max(20, Math.min(maxStepX, maxStepY));

    const gap = Math.ceil(0.1 * step);
    const cellSize = step - gap;
    this.element.style.gridTemplateColumns =
      (cellSize + 'px ').repeat(this.columnCount).slice(0, -1);
    this.element.style.gridTemplateRows =
      (cellSize + 'px ').repeat(this.rowCount).slice(0, -1);
    this.element.style.gap = gap + "px";
    this.element.style.fontSize = Math.round(cellSize / 3) + "px";
    this.element.style.perspective =
      (Math.max(this.columnCount, this.rowCount) * step * 2) + "px";

    const cellLayout = BoardCell.computeLayout(cellSize);
    for (let i = 0; i < this.rows.length; ++i) {
      const row = this.rows[i];
      for (let j = 0; j < row.cells.length; ++j) {
        row.cells[j].layout = cellLayout;
      }
    }
  }
}

class Game {
  constructor() {
    this._currentAttemptIndex = 0;
    this._currentLetterIndex = 0;
    this.outcome = null;
    this._updateCurrentCell();
  }

  get currentAttemptIndex() { return this._currentAttemptIndex; }

  set currentAttemptIndex(value) {
    this._currentAttemptIndex = value;
    this._updateCurrentCell();
  }

  get currentLetterIndex() { return this._currentLetterIndex; }

  set currentLetterIndex(value) {
    this._currentLetterIndex = value;
    this._updateCurrentCell();
  }

  get currentRow() { return this._currentRow; }

  get currentCell() { return this._currentCell; }

  _updateCurrentCell() {
    const row = board.rows[this.currentAttemptIndex];
    const cell = row ? row.cells[this.currentLetterIndex] : null;
    if (this._currentCell === cell) {
      return;
    }
    if (this._currentCell) {
      this._currentCell.isCurrent = false;
    }
    if (cell) {
      cell.isCurrent = true;
    }
    this._currentRow = row;
    this._currentCell = cell;
  }
}

const WORD_LENGTH = 5;
const ATTEMPT_COUNT = 6;
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['OK', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
  ['Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż'],
];
const NOTE_6_PLUS = {
  value: 7,
  description: "celujący+",
};
const NOTE_6 = {
  value: 6,
  description: "celujący",
};
const NOTE_5 = {
  value: 5,
  description: "bardzo dobry",
};
const NOTE_4 = {
  value: 4,
  description: "dobry",
};
const NOTE_3 = {
  value: 3,
  description: "dostateczny",
};
const NOTE_2 = {
  value: 2,
  description: "dopuszczający",
}
const NOTE_1 = {
  value: 1,
  description: "niedostateczny",
}
const OUTCOME_NOTES = {
  "1/6": NOTE_6_PLUS,
  "2/6": NOTE_6_PLUS,
  "3/6": NOTE_6,
  "4/6": NOTE_5,
  "5/6": NOTE_4,
  "6/6": NOTE_3,
  "X/6": NOTE_2,
  "-/6": NOTE_2,
};

let game = null;
let board = null;
let exampleAttemptBoard = null;
let exampleSolutionBoard = null;
const keyboardKeyElements = [];
let successfulAttemptIndex = null;
let solution = null;
let history = null;
let progress = null;

window.onload = function () {
  loadSolution(initializeGame);
};

function initializeGame() {
  board = new Board(boardContainerElement, WORD_LENGTH, ATTEMPT_COUNT);
  game = new Game();

  exampleAttemptBoard = Board.example(exampleAttemptBoardContainerElement);
  exampleSolutionBoard = Board.example(exampleSolutionBoardContainerElement);
  checkBoardRow(exampleAttemptBoard.rows[0], exampleSolutionBoard.word);
  checkBoardRow(exampleSolutionBoard.rows[0], exampleSolutionBoard.word);
  
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

      if (key == 'OK') {
        keyElement.classList.add('ok', 'wide');
      } else if (key == 'backspace') {
        keyElement.classList.add('backspace', 'wide', 'material-icons');
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

  loadHistory();
  loadProgress();
  loadSettings();
};

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
  board.layOut();
  exampleAttemptBoard.layOut();
  exampleSolutionBoard.layOut();
}

function onWindowKeyDown(e) {
	if (e.keyCode == 13) {
    onKey('OK');
  } else if (e.keyCode == 8) {
    onKey('backspace');
  } else {
    onKey(e.key.toUpperCase());
  }
};

function onKeyClick(e) {
  onKey(e.target.textContent);
}

function onKey(key) {
	if (!game.currentRow) {
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
  
  if (key == 'OK') {
  	if (game.currentLetterIndex == WORD_LENGTH) {
    	commitCurrentAttempt();
    } else {
      showToast('Wpisz 5-literowe słowo');
    }
  } else if (key == 'backspace') {
    if (game.currentLetterIndex > 0) {
      --game.currentLetterIndex;
      game.currentCell.letter = null;
    }
  } else if (game.currentLetterIndex < WORD_LENGTH) {
    game.currentCell.letter = key;
    ++game.currentLetterIndex;
  }
}

function commitCurrentAttempt() {
  let word = "";
  const row = game.currentRow;
  for (let j = 0; j < WORD_LENGTH; ++j) {
    word += row.cells[j].letter;
  }

  if (!WORDS.includes(word)) {
    showToast('Słowo "' + word + '" nie występuje w słowniku');
    return null;
  }

  progress.attempts[game.currentAttemptIndex] = word;
  saveProgress();
  
  checkCurrentAttempt();

  const callback = (successfulAttemptIndex != null) ? showStatsPopup : null;
  animateAttemptStatus(row, callback);
}

function checkBoardRow(row, solutionWord) {
  const solutionLetters = solutionWord.split('');
  let matchCount = 0;

  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.letter;
    if (letter == solutionWord[j]) {
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
    const letter = cell.letter;
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
  const match = checkBoardRow(game.currentRow, solution.word);

  if (match) {
    finishGame(true);
  } else {
    ++game.currentAttemptIndex;
    game.currentLetterIndex = 0;
    if (game.currentAttemptIndex >= ATTEMPT_COUNT) {
      finishGame(false);
    }
  }
}

function finishGame(success) {
  if (success) {
    successfulAttemptIndex = game.currentAttemptIndex;
    game.currentAttemptIndex = ATTEMPT_COUNT;
    game.outcome = (successfulAttemptIndex + 1) + "/" +  ATTEMPT_COUNT;
  } else {
    successfulAttemptIndex = -1;
    game.outcome = "X/" + ATTEMPT_COUNT
  }

  shareButtonElement.removeAttribute('disabled');
  
  history[history.length - 1].o = game.outcome;
  saveHistory();
}

function animateAttemptStatus(row, callback, interval = 250) {
  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.letter;
    setTimeout(function () {
      cell.applyCommittedStyle();
      if (!row.board.isExample) {
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
    const row = board.rows[i];
    const word = progress.attempts[i];
    for (let j = 0; j < WORD_LENGTH; ++j) {
      row.cells[j].letter = word[j];
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

function loadHistory() {
  history = localStorage.getItem('history');
  if (history) {
    history = JSON.parse(history);
  } else {
    history = [];
  }

  if (history.length == 0 || history[history.length - 1].i != solution.id) {
    history.push({ i: solution.id, o: "-/6" });
    saveHistory();
  }
}

function saveHistory() {
  localStorage.setItem('history', JSON.stringify(history));
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
  if (game.outcome == null) {
    return;
  }
  
  let data = "Słowle " + solution.id + " " + game.outcome + "\n";
  const printedRowCount = successfulAttemptIndex >= 0
    ? successfulAttemptIndex + 1
    : ATTEMPT_COUNT;
  for (let i = 0; i < printedRowCount; ++i) {
    const row = board.rows[i];
    data += "\n";
    for (let j = 0; j < WORD_LENGTH; ++j) {
      const status = row.cells[j].status;
      if (status == 'match') {
        data += "🟦";
      } else if (status == 'partial') {
        data += "🟧";
      } else {
        data += "⬛";
      }
    }
  }
  
  try {
    console.log(data);
    navigator.clipboard.writeText(data);
    showToast("Skopiowano do schowka");
  } catch (_) {
    /* Ignore. */
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
  let winCount = 0;
  let concludedCount = 0;
  let noteSum = 0;
  let noteCount = 0;
  let previousSolutionId = history[0].i - 1;
  for (let k = 0; k < history.length; ++k) {
    const entry = history[k];

    const outcome = entry.o;
    if (outcome[0] != '-' && outcome[0] != 'X') {
      ++winCount;
    }

    if (k != history.length - 1 || game.outcome != null) {
      noteSum += OUTCOME_NOTES[outcome].value;
      ++noteCount;
      ++concludedCount;
    }

    const solutionId = entry.i;
    const skipCount = solutionId - previousSolutionId - 1;
    previousSolutionId = solutionId;

    const skipPenaltyCount = Math.min(skipCount, 5);
    console.log(skipCount);
    noteSum += skipPenaltyCount * NOTE_1.value;
    noteCount += skipPenaltyCount;
  }

  if (game.outcome != null) {
    if (successfulAttemptIndex >= 0) {
      statsPopupVerdictElement.textContent =
        "Brawo! Liczba prób: " + (successfulAttemptIndex + 1);
    } else {
      statsPopupVerdictElement.textContent = "Niestety nie udało się tym razem";
    }
    statsPopupSolutionElement.textContent =
      "Rozwiązanie: \"" + solution.word + "\"";

    const note = OUTCOME_NOTES[game.outcome];
    const normalizedNote = Math.min(note.value, 6);
    noteSectionElement.setAttribute('note', normalizedNote);
    noteValueElement.textContent = normalizedNote;
    noteDescriptionElement.textContent = note.description;
    if (normalizedNote != note.value) {
      noteValueElement.classList.add('plus');
    }
  }

  playedCountElement.textContent = history.length;
  if (history.length == 1) {
    playedCountLabelElement.textContent = "gra"
  } else {
    const d = history.length % 10;
    const dd = history.length % 100;
    if ((10 <= dd && dd <= 21) || (d <= 1 || 5 <= d)) {
      playedCountLabelElement.textContent = "gier"
    } else {
      playedCountLabelElement.textContent = "gry"
    }
  }

  winPercentageElement.textContent =
    Math.round(100 * winCount / Math.max(1, concludedCount)) + "%";

  const noteAverage = (noteSum / Math.max(1, noteCount));
  noteAverageElement.textContent = noteAverage.toFixed(2);
  noteAverageElement.setAttribute(
    'note',
    Math.max(1, Math.min(6, Math.round(noteAverage))));

  showPopup('stats');
}

function showAboutPopup() {
  showPopup('about');
  exampleAttemptBoard.layOut();
  exampleSolutionBoard.layOut();
  setTimeout(function () { animateAttemptStatus(exampleAttemptBoard.rows[0]); }, 200);
  setTimeout(function () { animateAttemptStatus(exampleSolutionBoard.rows[0]); }, 800);
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

