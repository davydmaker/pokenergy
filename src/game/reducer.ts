import type { GameState, Card, DeckConfig, HistoryEntry } from './types';
import { buildDeck, shuffle, isEnergy, getEnergyId } from './engine';
import { UNDO_STACK_LIMIT } from './constants';

export type GameAction =
  | { type: 'INIT_GAME'; config: DeckConfig }
  | { type: 'DRAW_CARD' }
  | { type: 'SHUFFLE_DECK' }
  | { type: 'DISCARD_FROM_HAND'; typeId: string }
  | { type: 'RECOVER_DISCARD'; typeId: string }
  | { type: 'SHUFFLE_HAND_AND_DRAW'; drawCount: number }
  | { type: 'SEARCH_DECK_TO_HAND'; typeId: string }
  | { type: 'SEARCH_DECK_TO_PLAY'; typeId: string }
  | { type: 'DISCARD_FROM_PLAY'; typeId: string }
  | { type: 'RECOVER_DISCARD_TO_DECK'; typeId: string }
  | { type: 'HAND_TO_PLAY'; typeId: string }
  | { type: 'FLIP_COIN'; result: 'heads' | 'tails' }
  | { type: 'UNDO' }
  | { type: 'SET_STATE'; state: GameState };

interface ReducerState {
  current: GameState;
  undoStack: GameState[];
}

function now(): string {
  return new Date().toLocaleTimeString();
}

function h(key: string, isEnergy: boolean, params?: Record<string, string | number>, priv?: boolean, publicOnly?: boolean): HistoryEntry {
  return { key, params, isEnergy, time: now(), private: priv, publicOnly };
}

function withUndo(state: ReducerState, next: GameState): ReducerState {
  return {
    current: next,
    undoStack: [...state.undoStack.slice(-UNDO_STACK_LIMIT + 1), state.current],
  };
}

export const initialGameState: GameState = {
  deck: [],
  discardPile: [],
  prizePile: [],
  hand: {},
  history: [],
  config: { deckSize: 60, totalEnergy: 20, energyCounts: {}, prizeCount: 6, initialHand: 7 },
};

export const initialReducerState: ReducerState = {
  current: initialGameState,
  undoStack: [],
};

export function gameReducer(state: ReducerState, action: GameAction): ReducerState {
  const gs = state.current;

  switch (action.type) {
    case 'INIT_GAME': {
      const cfg = action.config;
      if (cfg.deckSize < 1 || cfg.totalEnergy < 0 || cfg.totalEnergy > cfg.deckSize
          || cfg.prizeCount < 0 || cfg.initialHand < 0) {
        return state;
      }

      let deck = shuffle(buildDeck(cfg));

      // Remove prize cards (only without energy)
      const maxPrizes = deck.filter(c => !isEnergy(c)).length;
      const actualPrizeCount = Math.min(cfg.prizeCount, maxPrizes);
      let prizeRemoved = 0;
      const newDeck: Card[] = [];
      for (const card of deck) {
        if (prizeRemoved < actualPrizeCount && !isEnergy(card)) {
          prizeRemoved++;
        } else {
          newDeck.push(card);
        }
      }
      deck = shuffle(newDeck);

      const hand: Record<string, number> = {};
      let energyCount = 0;
      for (let i = 0; i < cfg.initialHand; i++) {
        if (deck.length === 0) break;
        const card = deck.shift()!;
        const id = getEnergyId(card);
        if (id) {
          hand[id] = (hand[id] || 0) + 1;
          energyCount++;
        }
      }

      const historyEntries: HistoryEntry[] = [];
      if (prizeRemoved > 0) {
        historyEntries.push(h('hist.prizeCards', false, { count: prizeRemoved }));
      }
      historyEntries.push(h('hist.gameStarted', energyCount > 0, { count: energyCount }, true));

      return {
        current: {
          deck,
          discardPile: [],
          prizePile: [],
          hand,
          history: historyEntries,
          config: cfg,
        },
        undoStack: [],
      };
    }

    case 'DRAW_CARD': {
      if (gs.deck.length === 0) return state;
      const newDeck = [...gs.deck];
      const card = newDeck.shift()!;
      const id = getEnergyId(card);
      const newHand = { ...gs.hand };
      if (id) newHand[id] = (newHand[id] || 0) + 1;

      return withUndo(state, {
        ...gs,
        deck: newDeck,
        hand: newHand,
        history: [
          id
            ? h('hist.drewEnergy', true, { name: id }, true)
            : h('hist.drewNotEnergy', false, undefined, true),
          h('hist.drewCard', false, undefined, false, true),
          ...gs.history,
        ],
      });
    }

    case 'SHUFFLE_DECK': {
      return withUndo(state, {
        ...gs,
        deck: shuffle(gs.deck),
        history: [h('hist.shuffled', false), ...gs.history],
      });
    }

    case 'DISCARD_FROM_HAND': {
      const newHand = { ...gs.hand };
      if ((newHand[action.typeId] || 0) <= 0) return state;
      newHand[action.typeId]--;
      if (newHand[action.typeId] === 0) delete newHand[action.typeId];
      return withUndo(state, {
        ...gs,
        hand: newHand,
        discardPile: [...gs.discardPile, action.typeId],
        history: [h('hist.discardedFromHand', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'RECOVER_DISCARD': {
      const idx = gs.discardPile.indexOf(action.typeId);
      if (idx === -1) return state;
      const newDiscard = [...gs.discardPile];
      newDiscard.splice(idx, 1);
      const newHand = { ...gs.hand };
      newHand[action.typeId] = (newHand[action.typeId] || 0) + 1;
      return withUndo(state, {
        ...gs,
        discardPile: newDiscard,
        hand: newHand,
        history: [h('hist.recoveredEnergy', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'SHUFFLE_HAND_AND_DRAW': {
      const handTotal = Object.values(gs.hand).reduce((a, b) => a + b, 0);
      const newDeck = [...gs.deck];
      for (const [typeId, count] of Object.entries(gs.hand)) {
        for (let i = 0; i < count; i++) newDeck.push(`energy:${typeId}` as Card);
      }
      const shuffled = shuffle(newDeck);
      const drawCount = Math.min(Math.max(0, action.drawCount), shuffled.length);
      const newHand: Record<string, number> = {};
      let drawnCount = 0;
      for (let i = 0; i < drawCount; i++) {
        if (shuffled.length === 0) break;
        const card = shuffled.shift()!;
        const id = getEnergyId(card);
        if (id) {
          newHand[id] = (newHand[id] || 0) + 1;
          drawnCount++;
        }
      }
      return withUndo(state, {
        ...gs,
        deck: shuffled,
        hand: newHand,
        history: [
          h('hist.shuffledHand', drawnCount > 0, { handCount: handTotal, drawCount, drawnCount }, true),
          h('hist.shuffledHandPublic', false, { drawCount }, false, true),
          ...gs.history,
        ],
      });
    }

    case 'SEARCH_DECK_TO_HAND': {
      const idx = gs.deck.indexOf(`energy:${action.typeId}` as Card);
      if (idx === -1) return state;
      const newDeck = [...gs.deck];
      newDeck.splice(idx, 1);
      const newHand = { ...gs.hand };
      newHand[action.typeId] = (newHand[action.typeId] || 0) + 1;
      return withUndo(state, {
        ...gs,
        deck: shuffle(newDeck),
        hand: newHand,
        history: [h('hist.searchedToHand', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'SEARCH_DECK_TO_PLAY': {
      const idx = gs.deck.indexOf(`energy:${action.typeId}` as Card);
      if (idx === -1) return state;
      const newDeck = [...gs.deck];
      newDeck.splice(idx, 1);
      return withUndo(state, {
        ...gs,
        deck: shuffle(newDeck),
        history: [h('hist.searchedToPlay', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'DISCARD_FROM_PLAY': {
      return withUndo(state, {
        ...gs,
        discardPile: [...gs.discardPile, action.typeId],
        history: [h('hist.discardedFromPlay', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'RECOVER_DISCARD_TO_DECK': {
      const idx = gs.discardPile.indexOf(action.typeId);
      if (idx === -1) return state;
      const newDiscard = [...gs.discardPile];
      newDiscard.splice(idx, 1);
      const newDeck = shuffle([...gs.deck, `energy:${action.typeId}` as Card]);
      return withUndo(state, {
        ...gs,
        discardPile: newDiscard,
        deck: newDeck,
        history: [h('hist.recoveredToDeck', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'HAND_TO_PLAY': {
      const newHand = { ...gs.hand };
      if ((newHand[action.typeId] || 0) <= 0) return state;
      newHand[action.typeId]--;
      if (newHand[action.typeId] === 0) delete newHand[action.typeId];
      return withUndo(state, {
        ...gs,
        hand: newHand,
        history: [h('hist.handToPlay', true, { name: action.typeId }), ...gs.history],
      });
    }

    case 'FLIP_COIN': {
      const result = action.result;
      return withUndo(state, {
        ...gs,
        history: [h('hist.coinFlip', false, { result }), ...gs.history],
      });
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      return { current: prev, undoStack: newStack };
    }

    case 'SET_STATE': {
      return { ...state, current: action.state };
    }

    default:
      return state;
  }
}
