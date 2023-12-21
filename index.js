class BoardCell {
  constructor(row, columnIndex) {
    this.element = document.createElement('div');
    this.element.classList.add('cell');
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
      //this.statusTileElement.textContent = "";
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
    if (this.status) {
      this.element.setAttribute('status', this.status);
    } else {
      this.element.removeAttribute('status');
    }
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
      // TODO: The 90.00001deg is a hack to work around a bug in Safari 17.1.
      // I have no idea why, but the tile disappears at the end of transition
      // when the rotation is exactly 90deg.
      committedTransformStyle:
        "translateZ(-" + halfSizeStyle + ") rotateX(-90.00001deg)",
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
    this._extraBannerElement = null;
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

  get isExtra() { return !!this._extraBannerElement; }

  layOut() {
    const rect = this.containerElement.getBoundingClientRect();
    const oldRect = this._containerRect;
    if (oldRect &&
        oldRect.width == rect.width &&
        oldRect.height == rect.height) {
      return;
    }
    this._containerRect = rect;

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
    this.reset();
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

  reset() {
    this._currentAttemptIndex = 0;
    this._currentLetterIndex = 0;
    this.outcome = null;
    this._updateCurrentCell();
  }

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
const CORRUPTED_SOLUTION_IDS = [
  258,
];
const MONTH_NAMES = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];
const WEEKDAY_SHORT_NAMES = [
  "Nd",
  "Pn",
  "Wt",
  "Śr",
  "Cz",
  "Pt",
  "Sb",
];

let game = null;
let board = null;
let exampleAttemptBoard = null;
let exampleSolutionBoard = null;
const keyboardKeys = [];
let successfulAttemptIndex = null;
let solution = null;
let latestSolution = null;
let outcomes = null;
let progress = null;
let history = null;
let openSolutionIds = null;
let historyCallbacks = [];
let shouldIgnoreInput = false;

window.onload = function () {
  makeShowable(extraBannerElement, {
    show: false,
    frame: onExtraBannerShowHideFrame,
  });
  loadLatestSolution(initializeGame);
};

function initializeGame() {
  gtag('config', 'G-Q64DS2P5WF', {
    'send_page_view': false,
    'solution_id': latestSolution.id,
  });

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
      const value = keyboardRow[j];

      keyCellElement = document.createElement('div');
      keyCellElement.classList.add('keyboard-key-cell');
      keyCellElement.setAttribute('data-value', value);
      keyCellElement.onmousedown = onKeyMouseDown;

    	keyElement = document.createElement('div');
      keyElement.classList.add('keyboard-key');
      keyCellElement.append(keyElement);
      
      keyElement.textContent = value;

      if (value == 'OK') {
        keyCellElement.classList.add('wide');
        keyElement.classList.add('ok');
      } else if (value == 'backspace') {
        keyCellElement.classList.add('wide');
        keyElement.classList.add('backspace', 'material-icons');
      }
      
      rowElement.append(keyCellElement);

      keyboardKeys.push({
        value: value,
        element: keyElement,
        cellElement: keyCellElement,
      });
    }
    
    keyboardElement.append(rowElement);
  }

  setInterval(everySecond, 1000);

  window.onresize = onWindowResize;
  window.onkeydown = onWindowKeyDown;
  
  onWindowResize();

  loadOutcomes();
  const lastPlayed = loadLastPlayed();

  saveSettings();
  if (isFirstVisit) {
    showAboutPopup();
  }

  gtag('event', 'settings', {
    'theme': settings.theme,
  });

  if (lastPlayed) {
    startGame({ solutionId: lastPlayed })
  } else {
    startLatestGame();
  }
};

function everySecond() {
  const millisLeft = latestSolution.expiration - Date.now();
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
    if (keyboardElement.contains(document.activeElement)) {
      onKey('OK');
    }
  } else if (e.keyCode == 8) {
    onKey('backspace');
  } else {
    onKey(e.key.toUpperCase());
  }
};

function onKeyMouseDown(e) {
  onKey(e.currentTarget.getAttribute('data-value'));
}

function setShouldIgnoreInput(value) {
  shouldIgnoreInput = value;
  if (value) {
    board.element.classList.add('ignore-input');
  } else {
    board.element.classList.remove('ignore-input');
  }
}

function onKey(key) {
  if (shouldIgnoreInput) {
    return;
  }
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

  if (!keyboardElement.contains(document.activeElement)) {
    keyboardElement.focus();
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
  gtag('event', 'try_guess');

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

  let callback = null;
  if (game.outcome != null) {
    gtag('event', 'finish', {
      'outcome': game.outcome,
      'duration': Date.now() - progress.startTime,
    });
    callback = showStatsPopup;
  }

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

  // Only save if this is the first attempt.
  if (outcomes.get(solution.id)[0] == '-') {
    outcomes.set(solution.id, game.outcome);
    saveOutcomes();
  }
}

function animateAttemptStatus(row, callback, interval = 250) {
  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.letter;
    setTimeout(function () {
      cell.applyCommittedStyle();
      if (letter && !row.board.isExample) {
        const key = getKeyboardKey(letter);
        if (
            statusPriority(cell.status) >
            statusPriority(key.element.getAttribute('status'))) {
          key.element.setAttribute('status', cell.status);
        }
      }
    }, j * interval);
  }

  if (callback) {
    setTimeout(callback, (WORD_LENGTH - 1) * interval + 1000);
  }
}

function loadLastPlayed() {
  let legacyProgress = localStorage.getItem('progress');
  if (legacyProgress) {
    legacyProgress = JSON.parse(legacyProgress);
    if (legacyProgress.solutionId == latestSolution.id) {
      progress = legacyProgress;
      progress.date = expirationToDate(latestSolution.expiration);
      saveProgress();
    }
    // delete legacy progress
  }

  let lastPlayed = localStorage.getItem('lastPlayed');
  if (lastPlayed) {
    lastPlayed = parseInt(lastPlayed);
  }
  return lastPlayed;
}

function loadOrInitProgress(kwargs) {
  progress = localStorage.getItem(`progress#${kwargs.solutionId}`);
  if (progress) {
    progress = JSON.parse(progress);
  } else {
    // TODO: better kwargs handling
    console.assert(!!kwargs.solutionId);
    console.assert(!!kwargs.wordIndex);
    progress = {
      solutionId: kwargs.solutionId,
      wordIndex: kwargs.wordIndex,
      attempts: [],
      startTime: Date.now(),
    }
    if ('date' in kwargs) {
      progress.date = kwargs.date;
    } else if ('expiration' in kwargs) {
      progress.date = expirationToDate(kwargs.expiration);
    }
  }
  saveProgress();
}

function startGame(kwargs) {
  setShouldIgnoreInput(true);

  loadOrInitProgress(kwargs);

  solution = {
    id: progress.solutionId,
    index: progress.wordIndex,
    word: WORDS[progress.wordIndex],
  };

  if (!outcomes.has(solution.id)) {
    outcomes.set(solution.id, "-/6");
    saveOutcomes();
  }

  game.reset();
  successfulAttemptIndex = null;

  if (solution.id != latestSolution.id) {
    // TODO: Is it possible to not have date?
    extraBannerContentElement.textContent = progress.date
        ? `#${solution.id} z dnia ${progress.date}`
        : `#${solution.id}`;
    extraBannerElement.show(true);
  } else {
    extraBannerContentElement.textContent = "";
    extraBannerElement.show(false);
  }

  for (const key of keyboardKeys) {
    key.element.removeAttribute('status');
  }
  
  let wasNotEmpty = false;
  for (let i = 0; i < board.rows.length; ++i) {
    const row = board.rows[i];
    let isRowEmpty = true;
    for (const cell of row.cells) {
      if (!cell.letter) {
        break;
      }
      isRowEmpty = false;
      cell.letter = null;
      delete cell.status;
    }
    if (isRowEmpty) {
      break;
    }
    wasNotEmpty = true;
    setTimeout(function () { animateAttemptStatus(row, null, 50); }, i * 200);
  }

  setTimeout(
    function () {
      applyProgress(0, 0, function () {
        setShouldIgnoreInput(false);
        setTimeout(function () {
          if (successfulAttemptIndex != null && !isPopupShown()){
            showStatsPopup();
          }
        }, 1000);
      });
    },
    wasNotEmpty ? 500 : 0,
  );
}

function startLatestGame() {
  startGame({
    solutionId: latestSolution.id,
    wordIndex: latestSolution.index,
    expiration: latestSolution.expiration,
  });
}

function applyProgress(i, j, callback) {
  if (i >= progress.attempts.length) {
    if (i == 0) {
      callback();
    }
    return;
  }

  const row = board.rows[i];
  const word = progress.attempts[i];
  
  row.cells[j].letter = word[j];

  ++j;
  if (j >= WORD_LENGTH) {
    j = 0;
    ++i;
    checkCurrentAttempt();
    animateAttemptStatus(row, callback, 50); 
  }

  setTimeout(function () { applyProgress(i, j, callback); }, 50);
}

function saveProgress() {
  if (solution && solution.isRandom) {
    return;
  }

  localStorage.setItem('lastPlayed', progress.solutionId.toString());
  localStorage.setItem(
    `progress#${progress.solutionId}`,
    JSON.stringify(progress));
}

function loadJson(name, callback) {
  const guardedCallback = function (json) {
    if (callback) {
      callback(json);
      callback = null;
    }
  }
  const failureCallback = function () { guardedCallback(null); }

  const request = new XMLHttpRequest();
  // Adding timestamp query parameter to prevent caching.
  request.open('GET', name + ".json" + "?t=" + Date.now(), true);
  request.timeout = 5000;
  request.onerror = failureCallback;
  request.ontimeout = failureCallback;
  request.onload = function () {
    const json = JSON.parse(request.responseText);
    guardedCallback(json);
  }
  request.send(null);
}

function loadLatestSolution(callback) {
  if (window.location.search) {
    const params = window.location.search.substring(1).split('&');
    if (params.includes("ula=1")) {
      const index = Math.min(
        Math.floor(Math.random() * WORDS.length),
        WORDS.length - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      solution = {
        id: 69420,
        word: WORDS[index],
        expiration: tomorrow,
        isRandom: true,
      };
      showToast(
        "Grasz w losowe Słowle. " +
        "To jest tryb experymentalny, więc polecam grać w Incognito, " +
        "żeby przypadkiem nie popsuć sobie ocen.");
      callback();
      return;
    }
  }

  loadJson('solution', function (candidates) {
    if (candidates) {
      const now = Date.now();
      for (const candidate of candidates) {
        candidate.expiration = Date.parse(candidate.expiration);
        if (now <= candidate.expiration) {
          latestSolution = candidate;
          // solution.word = WORDS[candidate.index];
          // latestSolution = solution;
          callback();
          return;
        }
      }
    }

    showToast("Nie można załadować słowa. Spróbuj ponownie później.")
  });
}

function loadOutcomes() {
  let outcomeArray = localStorage.getItem('history');
  if (outcomeArray) {
    outcomeArray = JSON.parse(outcomeArray);
  } else {
    outcomeArray = [];
  }

  outcomes = new Map();
  for (const outcome of outcomeArray) {
    outcomes.set(outcome.i, outcome.o);
  }
}

function getSortedOutcomeArray() {
  const outcomeArray = [];
  for (const [i, o] of outcomes) {
    outcomeArray.push({ i: i, o: o });
  }
  outcomeArray.sort((a, b) => a.i - b.i);
  return outcomeArray;
}

function saveOutcomes() {
  if (solution.isRandom) {
    return;
  }
  localStorage.setItem('history', JSON.stringify(getSortedOutcomeArray()));
}

function expirationToYearMonthDay(expiration) {
  const validNoonish = new Date(expiration - 12 * 60 * 60 * 1000);
  const year = validNoonish.getUTCFullYear();
  const month = validNoonish.getUTCMonth();
  const day = validNoonish.getUTCDate() - 1;
  return [year, month, day];
}

function formatYearMonthDay(year, month, day) {
  return `${day}.${padZeros(month)}.${year}`;
}

function expirationToDate(expiration) {
  return formatYearMonthDay(...expirationToYearMonthDay(expiration));
}

function loadOpenGames() {
  function tryLoadOpenGame(key) {
    const solutionId = parseInt(key.substring('progress#'.length));
    if (isNaN(solutionId)) {
      return null;
    }
    const openGame = JSON.parse(localStorage.getItem(key));
    if (solutionId != latestSolution.id && solutionId != progress.solutionId) {
      const attempts = openGame.attempts;
      if (attempts.length == 0 || attempts.length >= ATTEMPT_COUNT) {
        return null;
      }
      if (attempts[attempts.length - 1] == WORDS[openGame.wordIndex]) {
        return null;
      }
    }
    return openGame;
  }

  const retiredProgressKeys = [];
  const openGames = [];
  for (const key in localStorage) {
    if (!key.startsWith('progress#')) {
      continue;
    }
    const openGame = tryLoadOpenGame(key);
    if (openGame) {
      openGames.push(openGame);
    } else {
      retiredProgressKeys.push(key);
    }
  }

  openGames.sort((a, b) => a.solutionId - b.solutionId);
  for (const key of retiredProgressKeys) {
    localStorage.removeItem(key);
  }

  openGamesElement.innerHTML = '';
  openSolutionIds = new Set();
  for (openGame of openGames) {
    createChildElement(openGamesElement, `
      <li class="open-game">
        ${openGame.solutionId}, ${openGame.date}
      </li>
    `);
    openSolutionIds.add(openGame.solutionId);
  }
}

function loadHistory(callback) {
  if (history) {
    callback();
    return;
  }

  historyCallbacks.push(callback);
  if (historyCallbacks.length > 1) {
    return;
  }

  loadJson('history', function (json) {
    history = [];
    if (!json) {
      showToast("Nie można załadować historii.");
      return;
    }

    history = [];
    historyYear = { year: null };
    for (const entry of json) {
      const expiration = Date.parse(entry.expiration);
      const [year, month, day] = expirationToYearMonthDay(expiration);

      if (year != historyYear.year) {
        historyYear = {
          year: year,
          iyear: history.length,
          months: []
        };
        let it = new Date(0);
        it.setUTCFullYear(year);
        while (it.getUTCFullYear() == year) {
          const historyMonth = {
            month: it.getUTCMonth(),
            days: [],
          };
          while (it.getUTCMonth() == historyMonth.month) {
            historyMonth.days.push({
              day: it.getUTCDate(),
              dayOfWeek: it.getUTCDay(),
              valid: false,
            });
            it.setUTCDate(it.getUTCDate() + 1);
          }
          historyYear.months.push(historyMonth);
        }
        history.push(historyYear);
      }

      historyDay = historyYear.months[month].days[day];
      historyDay.valid = true;
      historyDay.wordIndex = entry.index;
      historyDay.solutionId = entry.id;
    }
    
    for (const historyYear of history) {
      for (const historyMonth of historyYear.months) {
        let challengeCount = 0;
        for (const historyDay of historyMonth.days) {
          if (historyDay.valid) {
            ++challengeCount;
          }
        }
        historyMonth.challengeCount = challengeCount;
      }
    }

    for (const historyYear of history) {
      const yearElement = createChildElement(historyElement, `
        <li class="year">
          <span class="year-header">${historyYear.year}</span>
          <ul class="months"></ul>
        </li>
      `);
      const monthListElement = yearElement.querySelector('.months');
      for (const historyMonth of historyYear.months) {
        const monthElement = createChildElement(monthListElement, `
          <li class="month-cell"">
            <div class="month">
              <span>${MONTH_NAMES[historyMonth.month]}</span>
              <br>
              <span>${historyMonth.challengeCount}</span>
            </div>
          </li>
        `);
        monthElement.addEventListener(
          'click',
          (_) => onHistoryMonthClick(historyYear.iyear, historyMonth.month));
      }
    }

    for (const callback of historyCallbacks) {
      callback();
    }
    historyCallbacks = [];
  });
}

function onExtraBannerShowHideFrame() {
  if (extraBannerElement.showHide.phase == 'begin') {
    const contentHeight =
      extraBannerElement.firstElementChild.getBoundingClientRect().height;
    extraBannerElement.style.setProperty(
      '--content-height', contentHeight + "px");
  }
  board.layOut();
}

function onExtraBannerCloseClick() {
  extraBannerElement.show(false);
  startLatestGame();
}

function onHistoryMonthClick(iyear, month) {
  historyMonthTitleElement.textContent
    = `${MONTH_NAMES[month]}  ${history[iyear].year}`;
  historyMonthElement.innerHTML = '';

  const historyMonth = history[iyear].months[month];
  for (const historyDay of historyMonth.days) {
    const dayElement = createChildElement(historyMonthElement, `
      <li class="day">
        <div class="cells">
          <div class="number">${historyDay.day}.</div>
          <div class="name">${WEEKDAY_SHORT_NAMES[historyDay.dayOfWeek]}</div>
          <div class="id"></div>
          <div class="word"></div>
          <div class="outcome"></div>
        </div>
      </li>
    `);
    dayElement.addEventListener('click', onHistoryDayClick);
    const idElement = dayElement.querySelector('.id');
    const wordElement = dayElement.querySelector('.word');
    const outcomeElement = dayElement.querySelector('.outcome');
    
    const solutionId = historyDay.solutionId;
    if (solutionId) {
      idElement.textContent = `#${solutionId}`;
      
      const isOpen = openSolutionIds.has(solutionId);
      if (isOpen) {
        dayElement.classList.add('open');
        wordElement.textContent = 'w trakcie';
      }

      const outcome = outcomes.get(solutionId);
      if (outcome) {
        if (!isOpen) {
          wordElement.textContent = "• • • • •";
        }
        outcomeElement.textContent = outcome;
      } else {
        if (!isOpen) {
          wordElement.textContent = "niegrane";
        }
      }

      const actionsElement = createChildElement(
        dayElement, `<div class="actions"></div>`);
      actionsElement.historyDay = historyDay;
      makeShowable(actionsElement, {
        show: false,
        frame: onHistoryDayActionsShowHideFrame,
      });
    } else {
      wordElement.textContent = 'usunięte';
      dayElement.classList.add('unavailable');
    }
  }

  showPopup('history-month');
}

let activeDayElement = null;
function onHistoryDayClick(e) {
  const dayElement = e.currentTarget.closest('.day');
  if (activeDayElement) {
    activeDayElement.querySelector('.actions').show(false);
  }
  if (activeDayElement == dayElement) {
    activeDayElement = null;
  } else {
    activeDayElement = dayElement;
    dayElement.querySelector('.actions').show(true);
  }
}

function onHistoryDayActionsShowHideFrame() {
  if (!this.showHide.target && this.showHide.phase == 'end') {
    this.innerHTML = '';
    this.drawerElement = null;
    return;
  }

  if (!this.drawerElement) {
    const solutionId = this.historyDay.solutionId;
    const isOpen = openSolutionIds.has(solutionId);
    const hasOutcome = outcomes.has(solutionId);
    const playButtonLabel = openSolutionIds.has(solutionId)
      ? 'Kontynuuj'
      : 'Graj';
    this.drawerElement = createChildElement(this, `
      <div class="drawer">
        ${}
        <button class="day-action-button reveal-word">Pokaż słowo</button>
      </div>
    `);
    const playButton = createChildElement(this.drawerElement, `<button class="day-action-button play">Graj</button>`)
    if (openSolutionIds.has(solutionId)) {
      playButtoncreateChildElement(this.drawerElement, ``)
    }
    this.innerHTML = `
      <div class="drawer">
        <button
            class="day-action-button reveal-word"
            onclick="onHistoryDayRevealWordClick(event)">
          Pokaż słowo
        <button
            class="day-action-button play"
            onclick="onHistoryDayPlayClick(event)">
          Graj
        </button>
      </div>
    `;
    this.drawerElement = this.querySelector('.drawer');
  }

  if (this.showHide.phase == 'begin') {
    this.style.setProperty(
      '--content-height',
      this.drawerElement.getBoundingClientRect().height + "px");
  }
}

function onHistoryDayPlayClick(e) {
  const actionsElement = e.currentTarget.closest('.actions');
  const solutionId = actionsElement.historyDay.solutionId;

  for (const historyYear of history) {
    for (const historyMonth of historyYear.months) {
      for (const historyDay of historyMonth.days) {
        if (historyDay.solutionId == solutionId) {
          hidePopup();
          startGame({
            solutionId: solutionId,
            wordIndex: historyDay.wordIndex,
            date: formatYearMonthDay(
              historyYear.year, historyMonth.month, historyDay.day),
          });
          return;
        }
      }
    }
  }
}

function onHistoryDayRevealWordClick(e) {
  console.log(`reveal word ${e}`);
}

function getKeyboardKey(value) {
  return keyboardKeys.find((key) => key.value == value);
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

function showToast(message, duration = 3000) {
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
  }, duration);

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

function isPopupShown() {
  return popupOverlayElement.hasAttribute('which')
}

function showStatsPopup() {
  const outcomes = getSortedOutcomeArray();
  let winCount = 0;
  let concludedCount = 0;
  let noteSum = 0;
  let noteCount = 0;
  let previousSolutionId = outcomes[0].i - 1;
  for (let k = 0; k < outcomes.length; ++k) {
    const entry = outcomes[k];
    const solutionId = entry.i;
    const outcome = entry.o;

    if (!CORRUPTED_SOLUTION_IDS.includes(solutionId)) {
      if (outcome[0] != '-' && outcome[0] != 'X') {
        ++winCount;
      }

      if (k != outcomes.length - 1 || game.outcome != null) {
        noteSum += OUTCOME_NOTES[outcome].value;
        ++noteCount;
        ++concludedCount;
      }
    }

    const skipCount = solutionId - previousSolutionId - 1;
    previousSolutionId = solutionId;

    const skipPenaltyCount = Math.min(skipCount, 5);
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

  playedCountElement.textContent = outcomes.length;
  if (outcomes.length == 1) {
    playedCountLabelElement.textContent = "gra"
  } else {
    const d = outcomes.length % 10;
    const dd = outcomes.length % 100;
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

function showSettingsPopup() {
  darkThemeCheckboxElement.checked = (settings.theme == 'dark');

  showPopup('settings');
}

function showHistoryPopup() {
  if (!progress) {
    return;
  }
  loadOpenGames();
  loadHistory(function () { showPopup('history'); });
}

function switchTheme() {
  settings.theme = (settings.theme == 'dark' ? 'light' : 'dark');
  saveSettings();
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

function makeShowable(element, args) {
  // TODO: See if you can do something less hacky than just setting custom
  // prop on the element.
  element.showHide = {
    frame: args.frame,
    target: !!args.show,
  };
  element.show = showHide_show;
  showHide_setPhase.call(element, 'end');
}

function showHide_show(target) {
  const element = this;
  if (element.showHide.target == target) {
    return;
  }
  const duration = showHide_getDuration.call(element);
  const token = {};
  element.showHide.token = token;
  element.showHide.target = target;
  element.showHide.phase = null;
  showHide_setPhase.call(element, 'begin');
  element.showHide.frame?.call(this);

  requestAnimationFrame(function (t0) {
    if (element.showHide.token !== token) {
      return;
    }
    showHide_setPhase.call(element, 'transition');
    const animationFrameCallback = function (t) {
      if (element.showHide.token !== token) {
        return;
      }
      if (t >= t0 + duration) {
        showHide_setPhase.call(element, 'end');
      }
      element.showHide.frame?.call(element);
      if (element.showHide.phase == 'transition') {
        requestAnimationFrame(animationFrameCallback);
      }
    };
    requestAnimationFrame(animationFrameCallback);
  });
}

function showHide_setPhase(phase) {
  if (this.showHide.phase == phase) {
    return;
  }
  this.showHide.phase = phase;
  let value = this.showHide.target ? 'show' : 'hide';
  if (phase != 'end') {
    value += '-' + phase;
  }
  this.setAttribute('show-hide', value);
}

function showHide_getDuration() {
  const durationProperty =
    getComputedStyle(this).getPropertyValue('--show-hide-duration');
  console.assert(durationProperty.endsWith('ms'));
  return parseInt(durationProperty.slice(0, -2));
}

function createElement(html) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

function createChildElement(parent, html) {
  const child = createElement(html);
  parent.append(child);
  return child;
}