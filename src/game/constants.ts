export const MAX_PLAYERS = 2;
export const UPDATE_THROTTLE_MS = 1000;
export const MIN_UPDATE_INTERVAL_SEC = 1;
export const ROOM_CODE_LENGTH = 6;
export const UNDO_STACK_LIMIT = 30;
export const HISTORY_DISPLAY_LIMIT = 20;
export const OPPONENT_HISTORY_LIMIT = 15;

export const STORAGE_KEYS = {
  theme: 'pokemon-energy-theme',
  locale: 'pokemon-energy-locale',
} as const;

export const DECK_DEFAULTS = {
  deckSize: 60,
  totalEnergy: 20,
  prizeCount: 6,
  initialHand: 7,
} as const;

export const DECK_LIMITS = {
  deckSize: { min: 20, max: 100 },
  prizeCount: { min: 0, max: 12 },
  initialHand: { min: 1, max: 15 },
} as const;
