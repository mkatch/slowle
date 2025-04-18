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
const CORRUPTED_SOLUTION_IDS = [
  258,
];

let game = null;
let board = null;
let exampleAttemptBoard = null;
let exampleSolutionBoard = null;
const keyboardKeys = [];
let successfulAttemptIndex = null;
let solution = null;
let outcomes = null;
let progress = null;

window.onload = function () {
  loadSolution(initializeGame);
};

function initializeGame() {
  gtag('config', 'G-Q64DS2P5WF', {
    'send_page_view': false,
    'solution_id': solution.id,
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
  loadProgress();

  saveSettings();
  if (isFirstVisit) {
    showAboutPopup();
  }

  gtag('event', 'settings', {
    'theme': settings.theme,
  });
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
  
  outcomes[outcomes.length - 1].o = game.outcome;
  saveOutcomes();
}

function animateAttemptStatus(row, callback, interval = 250) {
  for (let j = 0; j < WORD_LENGTH; ++j) {
    const cell = row.cells[j];
    const letter = cell.letter;
    setTimeout(function () {
      cell.applyCommittedStyle();
      if (!row.board.isExample) {
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
    gtag('event', 'start_game');
  }

  if (!progress.startTime) {
    progress.startTime = Date.now();
  }

  saveProgress();

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
  if (solution.isRandom) {
    return;
  }
  localStorage.setItem('progress', JSON.stringify(progress));
}

function loadSolution(callback) {
  let callbackCalled = false;
  const guardedCallback = function (candidate) {
    if (callbackCalled) {
      return;
    }
    callbackCalled = true;

    if (candidate && candidate.index) {
      solution = candidate;
      solution.word = WORDS[candidate.index];

      if (solution.id >= 1159 && solution.id <= 1159 + 7) {
        try {
          dismissedAnnouncementsStr = localStorage.getItem('dismissedAnnouncements') ?? "[]";
          dismissedAnnouncements = JSON.parse(dismissedAnnouncementsStr);
          const announcementTag = "march13_outage"
          if (!dismissedAnnouncements.includes(announcementTag)) {
            dismissedAnnouncements.push(announcementTag);
            localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
            showToast('Przepraszam za awarię 3-13 marca.<br>Dziękuję wszystkim za cierpliwość, wsparcie, i za granie w Słowle.', 0);
          }
        } catch (e) {
          console.error(e)
        }
      }

      callback();
    } else {
      solution = null;
      showToast("Nie można załadować słowa. Spróbuj ponownie później.")
    }
  }
  const failureCallback = function () { guardedCallback(null); }

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

function loadOutcomes() {
  outcomes = localStorage.getItem('history');
  if (outcomes) {
    outcomes = JSON.parse(outcomes);
  } else {
    outcomes = [];
  }

  if (outcomes.length == 0 || outcomes[outcomes.length - 1].i != solution.id) {
    outcomes.push({ i: solution.id, o: "-/6" });
    saveOutcomes();
  }
}

function saveOutcomes() {
  if (solution.isRandom) {
    return;
  }
  localStorage.setItem('history', JSON.stringify(outcomes));
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
  if (duration <= 0) {
    message += "<br><br>(kliknij, żeby zamknąć)";
  }

  toastElement.children[0].innerHTML = message;
  toastElement.classList.add('visible');
  const tag = Object();
  toastElement.tag = tag;

  if (duration > 0) {
    setTimeout(function () { closeToast(tag) }, duration);
  }

  toastElement.classList.add('opacity0');
  window.requestAnimationFrame(function () {
    if (toastElement.tag === tag) {
      toastElement.classList.remove('opacity0');
    }
  });
}

function onToastClick() {
  closeToast(toastElement.tag);
}

function closeToast(tag) {
  if (toastElement.tag === tag) {
    toastElement.classList.add('opacity0');
    setTimeout(function () {
      if (toastElement.tag === tag) {
        closeToast()
        toastElement.classList.remove('visible');
      }
    }, 200);
  }
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
  showPopup('history');
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

