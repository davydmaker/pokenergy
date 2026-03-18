export interface EnergyType {
  id: string;
  name: string;
  color: string;
}

export const ENERGY_TYPES: EnergyType[] = [
  { id: 'fire',      name: 'Fogo',     color: '#e94560' },
  { id: 'water',     name: 'Agua',     color: '#3498db' },
  { id: 'grass',     name: 'Planta',   color: '#27ae60' },
  { id: 'lightning', name: 'Elétrico', color: '#f1c40f' },
  { id: 'psychic',   name: 'Psíquico', color: '#9b59b6' },
  { id: 'fighting',  name: 'Lutador',  color: '#e67e22' },
  { id: 'darkness',  name: 'Noturno',  color: '#34495e' },
  { id: 'metal',     name: 'Metal',    color: '#95a5a6' },
  { id: 'fairy',     name: 'Fada',     color: '#fd79a8' },
  { id: 'dragon',    name: 'Dragão',   color: '#c0a43c' },
];

export type Card = `energy:${string}` | 'not-energy';

export interface DeckConfig {
  deckSize: number;
  totalEnergy: number;
  energyCounts: Record<string, number>;
  prizeCount: number;
  initialHand: number;
}

export interface HistoryEntry {
  key: string;
  params?: Record<string, string | number>;
  isEnergy: boolean;
  time: string;
  private?: boolean;
  publicOnly?: boolean;
}

export interface GameState {
  deck: Card[];
  discardPile: string[];
  prizePile: string[];
  hand: Record<string, number>;
  history: HistoryEntry[];
  config: DeckConfig;
}

export interface PlayerState {
  id: string;
  name: string;
  gameState: GameState;
  ready: boolean;
  connected: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  status: 'waiting' | 'configuring' | 'playing' | 'finished';
  currentTurn: string;
  turnOrder: string[];
  players: Record<string, PlayerState>;
  createdAt: number;
  expireAt: unknown;
}
