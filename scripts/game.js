export const COLORS = {
  R: { className: 'red', name: 'Roja' },
  B: { className: 'blue', name: 'Azul' },
  G: { className: 'gray', name: 'Neutra' },
  K: { className: 'black', name: 'Negra' }
};

export const LANGUAGES = { es: 'Castellano', en: 'English' };
export const DECKS = {
  normal: { name: 'Normal', file: 'normal.json' },
  english: { name: 'English', file: 'english.json' },
  infantil: { name: 'Infantil', file: 'infantil.json' },
  'peliculas-infantiles': {
    name: 'Pel\u00edculas infantiles',
    file: 'peliculas-infantiles.json'
  },
  peliculas: { name: 'Pel\u00edculas', file: 'peliculas.json' }
};
export const MARKS = [null, 'R', 'B', 'G', 'K'];

export async function loadJson(relativePath) {
  const response = await fetch(new URL(relativePath, import.meta.url), {
    cache: 'no-cache'
  });
  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los datos. Comprueba la conexi\u00f3n e intenta de nuevo.'
    );
  }
  return response.json();
}

export function isClue(pattern) {
  if (typeof pattern !== 'string' || !/^[RBGK]{25}$/.test(pattern)) {
    return false;
  }
  const count = (color) =>
    [...pattern].filter((letter) => letter === color).length;
  return (
    count('G') === 7 &&
    count('K') === 1 &&
    ((count('R') === 9 && count('B') === 8) ||
      (count('R') === 8 && count('B') === 9))
  );
}

export function validateClues(clues) {
  if (!Array.isArray(clues) || !clues.length || !clues.every(isClue)) {
    throw new Error('El fichero de pistas no tiene el formato esperado.');
  }
  return clues;
}

export function parseClueId(value, count) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }
  const clueId = Number(value);
  return Number.isSafeInteger(clueId) && clueId < count ? clueId : null;
}

export function shuffled(items) {
  const result = [...items];
  for (let position = result.length - 1; position > 0; position--) {
    const randomPosition = Math.floor(Math.random() * (position + 1));
    [result[position], result[randomPosition]] = [
      result[randomPosition],
      result[position]
    ];
  }
  return result;
}

export function selectWords(words) {
  if (
    !Array.isArray(words) ||
    !words.every((word) => typeof word === 'string' && word.trim())
  ) {
    throw new Error('El diccionario no tiene el formato esperado.');
  }
  const uniqueWords = [...new Set(words.map((word) => word.trim()))];
  if (uniqueWords.length < 25) {
    throw new Error('El diccionario necesita al menos 25 palabras diferentes.');
  }
  return shuffled(uniqueWords).slice(0, 25);
}

export function startingTeam(pattern) {
  return [...pattern].filter((letter) => letter === 'R').length === 9
    ? 'rojo'
    : 'azul';
}

export function incorrectMarks(pattern, marks) {
  return marks.flatMap((mark, position) =>
    mark !== null && mark !== pattern[position] ? [position] : []
  );
}

export function isSavedGame(game) {
  return (
    game !== null &&
    typeof game === 'object' &&
    ((game.schemaVersion === 1 && Object.hasOwn(LANGUAGES, game.language)) ||
      (game.schemaVersion === 2 && Object.hasOwn(DECKS, game.deckId))) &&
    Array.isArray(game.words) &&
    game.words.length === 25 &&
    game.words.every(
      (word) => typeof word === 'string' && word.trim().length > 0
    ) &&
    new Set(game.words).size === 25 &&
    Number.isSafeInteger(game.clueId) &&
    game.clueId >= 0 &&
    isClue(game.cluePattern) &&
    Array.isArray(game.marks) &&
    game.marks.length === 25 &&
    game.marks.every((mark) => MARKS.includes(mark))
  );
}
