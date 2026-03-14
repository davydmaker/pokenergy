import type { Card, DeckConfig } from './types';
import { ENERGY_TYPES } from './types';
import { ROOM_CODE_LENGTH } from './constants';

export function buildDeck(config: DeckConfig): Card[] {
  const cards: Card[] = [];
  ENERGY_TYPES.forEach(type => {
    for (let i = 0; i < (config.energyCounts[type.id] || 0); i++) {
      cards.push(`energy:${type.id}`);
    }
  });
  const nonEnergy = config.deckSize - config.totalEnergy;
  for (let i = 0; i < nonEnergy; i++) {
    cards.push('not-energy');
  }
  return cards;
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isEnergy(card: Card): card is `energy:${string}` {
  return card.startsWith('energy:');
}

export function getEnergyId(card: Card): string | null {
  if (!isEnergy(card)) return null;
  return card.split(':')[1];
}

export function getEnergyType(id: string) {
  return ENERGY_TYPES.find(t => t.id === id);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function countEnergiesInDeck(deck: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  deck.forEach(c => {
    const id = getEnergyId(c);
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}

export function totalEnergiesInDeck(deck: Card[]): number {
  return deck.filter(isEnergy).length;
}
