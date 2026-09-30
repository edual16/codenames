import {
  COLORS,
  loadJson,
  parseClueId,
  startingTeam,
  validateClues
} from './game.js';

const form = document.querySelector('#clue-form');
const input = document.querySelector('#clue-id');
const status = document.querySelector('#clue-status');
const view = document.querySelector('#clue-view');
const grid = document.querySelector('#clue-grid');
const cover = document.querySelector('#clue-cover');
const toggle = document.querySelector('#toggle-clue');
const random = document.querySelector('#random-clue');
const randomConfirmation = document.querySelector('#random-clue-dialog');
let clues = [];
let concealed = false;

function setVisibility(hidden) {
  concealed = hidden;
  grid.hidden = concealed;
  cover.hidden = !concealed;
  const label = concealed ? 'Mostrar pistas' : 'Ocultar pistas';
  toggle.setAttribute('aria-pressed', String(concealed));
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
  document.querySelector('#visibility-icon').src = concealed
    ? 'assets/icons/eye.svg'
    : 'assets/icons/eye-off.svg';
}

function openClue(value) {
  const clueId = parseClueId(value, clues.length);
  if (clueId === null) {
    status.textContent = `Introduce un n\u00famero entero entre 0 y ${clues.length - 1}`;
    status.className = 'status error';
    input.setAttribute('aria-invalid', 'true');
    view.hidden = true;
    toggle.disabled = true;
    return;
  }

  input.removeAttribute('aria-invalid');
  input.value = clueId;
  const pattern = clues[clueId];
  const team = startingTeam(pattern);
  document.querySelector('#clue-heading').textContent = `Ficha #${clueId}`;
  const teamLabel = document.querySelector('#starting-team');
  teamLabel.textContent = `Empieza el equipo ${team}`;
  teamLabel.className = `team-label team-${team}`;
  document.querySelector('#red-count').textContent =
    team === 'rojo' ? '9' : '8';
  document.querySelector('#blue-count').textContent =
    team === 'azul' ? '9' : '8';

  const cards = [...pattern].map((letter, position) => {
    const card = document.createElement('div');
    card.className = `clue-card ${COLORS[letter].className}`;
    card.setAttribute('role', 'img');
    card.setAttribute(
      'aria-label',
      `Fila ${Math.floor(position / 5) + 1}, columna ${(position % 5) + 1}: ${COLORS[letter].name}`
    );
    const mark = document.createElement('span');
    mark.textContent = { R: 'R', B: 'A', G: '\u00b7', K: '\u00d7' }[letter];
    mark.setAttribute('aria-hidden', 'true');
    card.append(mark);
    return card;
  });
  grid.replaceChildren(...cards);
  view.hidden = false;
  toggle.disabled = false;
  setVisibility(false);
  status.textContent = '';
  status.className = 'status';
  const url = new URL(location.href);
  url.searchParams.set('id', String(clueId));
  history.replaceState(null, '', url);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  openClue(input.value);
});
random.addEventListener('click', () => {
  if (!clues.length || randomConfirmation.open) return;
  randomConfirmation.returnValue = '';
  randomConfirmation.showModal();
});

randomConfirmation.addEventListener('close', () => {
  if (randomConfirmation.returnValue === 'confirm') {
    openClue(String(Math.floor(Math.random() * clues.length)));
  }
});

toggle.addEventListener('click', () => setVisibility(!concealed));

async function initialize() {
  try {
    clues = validateClues(await loadJson('../data/clues.json'));
    input.max = clues.length - 1;
    input.disabled = false;
    document.querySelector('#open-clue').disabled = false;
    random.disabled = false;
    const requestedId = new URL(location.href).searchParams.get('id');
    if (requestedId !== null) {
      input.value = requestedId;
      openClue(requestedId);
    } else {
      status.textContent = `Elige una ficha entre 0 y ${clues.length - 1}`;
    }
  } catch (error) {
    status.textContent =
      'No se pudieron cargar las pistas. Recarga la p\u00e1gina para volver a intentarlo.';
    status.className = 'status error';
  }
}

initialize();
