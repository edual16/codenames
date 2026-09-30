import {
  COLORS,
  DECKS,
  MARKS,
  incorrectMarks,
  isSavedGame,
  loadJson,
  parseClueId,
  selectWords,
  startingTeam,
  validateClues
} from './game.js';

const storageKey = 'codenames.game.v1';
const deckPreferenceKey = 'codenames.deck.v1';
const grid = document.querySelector('#word-grid');
const deck = document.querySelector('#deck');
const status = document.querySelector('#board-status');
const validation = document.querySelector('#validation-status');
const share = document.querySelector('#share-panel');
const shareButton = document.querySelector('#share-game');
const link = document.querySelector('#clue-link');
const qr = document.querySelector('#qr');
const confirmation = document.querySelector('#new-game-dialog');
const creatorStatus = document.querySelector('#creator-status');
const createButton = document.querySelector('#create-game');
const continueButton = document.querySelector('#continue-game');
const focusButton = document.querySelector('#focus-board');
const clueConfirmation = document.querySelector('#change-clue-dialog');
const clueInput = document.querySelector('#board-clue-id');
const clueStatus = document.querySelector('#change-clue-status');
let lastDeckId = 'normal';
let previousScroll = 0;
let clues = [];
let game = null;
let storageAvailable = true;
let busy = true;
let shareUrl = '';
let shareAllowed = true;

const wordResizeObserver = new ResizeObserver(fitCardWords);
wordResizeObserver.observe(grid);

function setBusy(value) {
  busy = value;
  document.querySelectorAll('.game-control').forEach((control) => {
    control.disabled = value || (!game && control.id !== 'new-game');
  });
  shareButton.disabled = value || !game || !shareAllowed;
  createButton.disabled = value;
  continueButton.disabled = value;
  deck.disabled = value;
}

function saveGame() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(game));
    localStorage.setItem(deckPreferenceKey, game.deckId);
  } catch {
    storageAvailable = false;
    status.textContent =
      'No se puede guardar en este dispositivo. La partida se conserva hasta cerrar o recargar.';
    status.className = 'status error';
  }
}

function clearValidation() {
  validation.textContent = '';
  validation.className = 'status validation-status';
  grid.querySelectorAll('.incorrect').forEach((card) => {
    card.classList.remove('incorrect');
    card.removeAttribute('aria-invalid');
  });
  fitCardWords();
}

function updateCard(card, position) {
  const mark = game.marks[position];
  card.className = `word-card${mark === null ? '' : ` ${COLORS[mark].className}`}`;
  card.setAttribute(
    'aria-label',
    `${game.words[position]}: ${mark === null ? 'Sin marcar' : COLORS[mark].name}`
  );
  card.querySelector('.card-mark').textContent =
    mark === null ? '' : { R: 'R', B: 'A', G: 'N', K: 'X' }[mark];
}

function fitCardWords() {
  grid.querySelectorAll('.card-word').forEach((text) => {
    text.style.fontSize = '';
    const availableWidth = text.clientWidth;
    if (availableWidth > 0 && text.scrollWidth > availableWidth) {
      const fontSize = parseFloat(getComputedStyle(text).fontSize);
      const fittedSize =
        Math.floor(
          ((fontSize * (availableWidth - 1)) / text.scrollWidth) * 10
        ) / 10;
      text.style.fontSize = `${fittedSize}px`;
    }
  });
}

function hideShare() {
  share.hidden = true;
  shareButton.setAttribute('aria-expanded', 'false');
  document.querySelector('#share-status').textContent = '';
}

function renderGame() {
  document.querySelector('#deck-name').textContent = DECKS[game.deckId].name;
  document.querySelector('#board-stage').hidden = false;
  document.querySelector('#board-heading').textContent =
    `Ficha #${game.clueId}`;
  const team = startingTeam(game.cluePattern);
  const label = document.querySelector('#starting-team');
  label.textContent = `Empieza el equipo ${team}`;
  label.className = `team-label team-${team}`;
  const cards = game.words.map((word, position) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.position = position;
    const text = document.createElement('span');
    text.className = 'card-word';
    text.textContent = word;
    const mark = document.createElement('span');
    mark.className = 'card-mark';
    mark.setAttribute('aria-hidden', 'true');
    card.append(text, mark);
    updateCard(card, position);
    return card;
  });
  grid.replaceChildren(...cards);
  clearValidation();
  hideShare();
  const url = new URL('pistas.html', location.href);
  url.searchParams.set('id', game.clueId);
  shareUrl = url.href;
  link.value = shareUrl;
  qr.replaceChildren();
  shareAllowed = clues[game.clueId] === game.cluePattern;
  shareButton.disabled = busy || !shareAllowed;
  status.className = 'status';
  status.textContent = '';
  if (!shareAllowed) {
    status.className = 'status error';
    status.textContent =
      'Las fichas han cambiado desde que se guard\u00f3 la partida. Cambia la ficha o crea una nueva antes de compartir.';
  } else if (!storageAvailable) {
    status.className = 'status error';
    status.textContent =
      'No se puede guardar en este dispositivo. La partida solo se conserva mientras esta p\u00e1gina siga abierta.';
  }
}

async function newGame(nextDeckId) {
  setBusy(true);
  status.textContent = 'Cargando palabras\u2026';
  status.className = 'status';
  creatorStatus.textContent = 'Creando partida\u2026';
  creatorStatus.className = 'status';
  try {
    const words = selectWords(
      await loadJson(`../data/words/${DECKS[nextDeckId].file}`)
    );
    const clueId = Math.floor(Math.random() * clues.length);
    game = {
      schemaVersion: 2,
      deckId: nextDeckId,
      words,
      clueId,
      cluePattern: clues[clueId],
      marks: Array(25).fill(null)
    };
    lastDeckId = nextDeckId;
    renderGame();
    saveGame();
    return true;
  } catch {
    status.textContent =
      'No se pudieron cargar las palabras. Vuelve a intentarlo con Nueva partida';
    status.className = 'status error';
    creatorStatus.textContent =
      'No se pudo cargar el mazo. Puedes elegir otro o volver a intentarlo';
    creatorStatus.className = 'status error';
    return false;
  } finally {
    setBusy(false);
  }
}

grid.addEventListener('click', (event) => {
  const card = event.target.closest('.word-card');
  if (!card || busy || !game) return;
  clearValidation();
  const position = Number(card.dataset.position);
  game.marks[position] =
    MARKS[(MARKS.indexOf(game.marks[position]) + 1) % MARKS.length];
  updateCard(card, position);
  saveGame();
});

document.querySelector('#validate-game').addEventListener('click', () => {
  if (!game || busy) return;
  clearValidation();
  const marked = game.marks.filter((mark) => mark !== null).length;
  if (!marked) {
    validation.textContent = 'No hay tarjetas marcadas que validar';
    return;
  }
  const errors = incorrectMarks(game.cluePattern, game.marks);
  errors.forEach((position) => {
    const card = grid.children[position];
    card.classList.add('incorrect');
    card.setAttribute('aria-invalid', 'true');
  });
  fitCardWords();
  validation.classList.add(errors.length ? 'error' : 'success');
  validation.textContent = errors.length
    ? `${errors.length} tarjetas no coinciden con la ficha`
    : 'Todas las tarjetas marcadas coinciden con la ficha';
});

function requestNewGame(initial = false) {
  if (busy || confirmation.open) return;
  deck.value = lastDeckId;
  document.querySelector('#confirmation-title').textContent =
    initial || !game ? 'Crear partida' : 'Nueva partida';
  document.querySelector('#confirmation-message').textContent = game
    ? 'Crear otra partida sustituir\u00e1 las palabras, la ficha y las marcas actuales'
    : 'Una partida nueva con 25 palabras y una ficha para los dos equipos';
  continueButton.hidden = !game;
  continueButton.textContent = initial ? 'Continuar partida' : 'Cancelar';
  creatorStatus.textContent = '';
  creatorStatus.className = 'status';
  confirmation.returnValue = '';
  confirmation.showModal();
}

document
  .querySelector('#create-game-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !Object.hasOwn(DECKS, deck.value)) return;
    if (await newGame(deck.value)) {
      confirmation.close('confirm');
    }
  });

continueButton.addEventListener('click', () => confirmation.close('cancel'));

confirmation.addEventListener('cancel', (event) => {
  if (!game || busy) event.preventDefault();
});

document.querySelector('#new-game').addEventListener('click', () => {
  requestNewGame();
});

document.querySelector('#change-clue').addEventListener('click', () => {
  if (busy || !game || clueConfirmation.open) return;
  clueInput.value = game.clueId;
  clueInput.max = clues.length - 1;
  clueInput.removeAttribute('aria-invalid');
  clueStatus.textContent = '';
  clueConfirmation.returnValue = '';
  clueConfirmation.showModal();
});

document
  .querySelector('#change-clue-form')
  .addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy || !game) return;
    const clueId = parseClueId(clueInput.value, clues.length);
    if (clueId === null) {
      clueStatus.textContent = `Introduce un n\u00famero entero entre 0 y ${clues.length - 1}`;
      clueInput.setAttribute('aria-invalid', 'true');
      clueInput.focus();
      return;
    }
    game = { ...game, clueId, cluePattern: clues[clueId] };
    renderGame();
    saveGame();
    clueConfirmation.close('confirm');
  });

document.querySelector('#cancel-clue-change').addEventListener('click', () => {
  clueConfirmation.close('cancel');
});

function setBoardFocus(focused) {
  if (focused && (busy || !game)) return;
  if (focused) {
    previousScroll = window.scrollY;
    hideShare();
  }
  document.body.classList.toggle('board-focused', focused);
  focusButton.setAttribute('aria-pressed', String(focused));
  const label = focused ? 'Salir del modo foco' : 'Ampliar tablero';
  focusButton.setAttribute('aria-label', label);
  focusButton.title = label;
  document.querySelector('#focus-icon').src = focused
    ? 'assets/icons/minimize.svg'
    : 'assets/icons/maximize.svg';
  if (!focused) window.scrollTo(0, previousScroll);
  focusButton.focus({ preventScroll: true });
}

focusButton.addEventListener('click', () => {
  setBoardFocus(!document.body.classList.contains('board-focused'));
});

document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    !confirmation.open &&
    !clueConfirmation.open &&
    document.body.classList.contains('board-focused')
  ) {
    setBoardFocus(false);
  }
});

shareButton.addEventListener('click', () => {
  if (!game || !shareAllowed) return;
  if (!share.hidden) {
    hideShare();
    return;
  }
  if (!qr.childElementCount) {
    try {
      if (typeof globalThis.QRCode !== 'function')
        throw new Error('QR unavailable');
      new globalThis.QRCode(qr, {
        text: shareUrl,
        width: 240,
        height: 240,
        correctLevel: globalThis.QRCode.CorrectLevel.M
      });
    } catch {
      document.querySelector('#share-status').textContent =
        'No se pudo generar el QR. Puedes copiar el enlace.';
    }
  }
  share.hidden = false;
  shareButton.setAttribute('aria-expanded', 'true');
});

document.querySelector('#copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    document.querySelector('#share-status').textContent = 'Enlace copiado';
  } catch {
    link.focus();
    link.select();
    document.querySelector('#share-status').textContent =
      'Selecciona y copia el enlace';
  }
});

async function initialize() {
  deck.replaceChildren(
    ...Object.entries(DECKS).map(([deckId, details]) => {
      const option = document.createElement('option');
      option.value = deckId;
      option.textContent = details.name;
      return option;
    })
  );
  try {
    clues = validateClues(await loadJson('../data/clues.json'));
  } catch {
    status.textContent =
      'No se pudieron cargar las fichas. Recarga la p\u00e1gina para volver a intentarlo.';
    status.className = 'status error';
    return;
  }
  let saved = null;
  let invalidSaved = false;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      saved = JSON.parse(raw);
      invalidSaved = !isSavedGame(saved);
    }
  } catch {
    storageAvailable = false;
    invalidSaved = true;
  }
  if (isSavedGame(saved)) {
    const { language, ...savedState } = saved;
    game = {
      ...savedState,
      schemaVersion: 2,
      deckId:
        saved.schemaVersion === 1
          ? language === 'en'
            ? 'english'
            : 'normal'
          : saved.deckId
    };
    lastDeckId = game.deckId;
    renderGame();
  } else {
    status.textContent = 'Crea una partida para empezar';
  }
  try {
    const previousDeck = localStorage.getItem(deckPreferenceKey);
    if (Object.hasOwn(DECKS, previousDeck)) lastDeckId = previousDeck;
  } catch {
    storageAvailable = false;
  }
  setBusy(false);
  requestNewGame(true);
  if (invalidSaved) {
    creatorStatus.textContent =
      'No se pudo recuperar la partida guardada. Puedes crear una nueva';
  }
}

initialize();
