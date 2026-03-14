import { doc, setDoc, getDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, getPlayerId } from './config';
import type { Room, GameState } from '../game/types';
import { generateRoomCode } from '../game/engine';
import { MAX_PLAYERS, UPDATE_THROTTLE_MS } from '../game/constants';

const ROOMS_COLLECTION = 'rooms';
const MAX_NAME_LENGTH = 50;

function sanitizeName(name: string): string {
  return name.slice(0, MAX_NAME_LENGTH).trim();
}

let updateTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUpdate: (() => Promise<void>) | null = null;

function throttledUpdate(fn: () => Promise<void>) {
  pendingUpdate = fn;
  if (updateTimer) return;

  updateTimer = setTimeout(async () => {
    updateTimer = null;
    const update = pendingUpdate;
    pendingUpdate = null;
    if (update) {
      try { await update(); } catch (e) { console.error('Throttled update failed:', e); }
    }
  }, UPDATE_THROTTLE_MS);
}

export async function createRoom(hostName: string): Promise<{ roomId: string; playerId: string }> {
  const playerId = await getPlayerId();
  let roomId = generateRoomCode();

  const existingSnap = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
  if (existingSnap.exists()) {
    roomId = generateRoomCode();
  }

  const room: Room = {
    id: roomId,
    hostId: playerId,
    status: 'waiting',
    currentTurn: playerId,
    turnOrder: [playerId],
    players: {
      [playerId]: {
        id: playerId,
        name: sanitizeName(hostName),
        gameState: null as unknown as GameState,
        ready: false,
        connected: true,
      },
    },
    createdAt: Date.now(),
  };

  await setDoc(doc(db, ROOMS_COLLECTION, roomId), room);
  return { roomId, playerId };
}

export async function joinRoom(roomId: string, playerName: string): Promise<{ playerId: string } | null> {
  const playerId = await getPlayerId();
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists()) return null;

    const room = snap.data() as Room;
    if (room.status !== 'waiting') return null;
    if (room.players[playerId]) return { playerId };
    if (Object.keys(room.players).length >= MAX_PLAYERS) throw new Error('ROOM_FULL');

    const safeName = sanitizeName(playerName);
    const existingNames = Object.values(room.players).map(p => p.name.toLowerCase());
    if (existingNames.includes(safeName.toLowerCase())) {
      throw new Error('DUPLICATE_NAME');
    }

    transaction.update(roomRef, {
      [`players.${playerId}`]: {
        id: playerId,
        name: safeName,
        gameState: null,
        ready: false,
        connected: true,
      },
      turnOrder: [...room.turnOrder, playerId],
    });

    return { playerId };
  });
}

async function writePlayerGameState(roomId: string, playerId: string, gameState: GameState) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  // Firestore rejects undefined values - strip them via JSON round-trip
  const sanitized = JSON.parse(JSON.stringify(gameState));
  await updateDoc(roomRef, {
    [`players.${playerId}.gameState`]: sanitized,
    [`players.${playerId}.ready`]: true,
    lastUpdate: serverTimestamp(),
  });
}

export async function initPlayerGameState(roomId: string, playerId: string, gameState: GameState) {
  await writePlayerGameState(roomId, playerId, gameState);
}

export function syncPlayerGameState(roomId: string, playerId: string, gameState: GameState) {
  throttledUpdate(() => writePlayerGameState(roomId, playerId, gameState));
}

export async function setRoomStatus(roomId: string, status: Room['status']) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { status, lastUpdate: serverTimestamp() });
}

export async function passTurn(roomId: string, currentPlayerId: string) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as Room;
    if (room.currentTurn !== currentPlayerId) return;

    const order = room.turnOrder;
    const currentIdx = order.indexOf(currentPlayerId);
    const nextIdx = (currentIdx + 1) % order.length;

    transaction.update(roomRef, {
      currentTurn: order[nextIdx],
      lastUpdate: serverTimestamp(),
    });
  });
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Room);
    } else {
      callback(null);
    }
  });
}

export { getPlayerId };
