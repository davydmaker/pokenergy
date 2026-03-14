import { useState, useEffect } from 'react';
import type { DeckConfig } from './game/types';
import { ROOM_CODE_LENGTH } from './game/constants';
import { useI18n } from './i18n/context';
import ConfigScreen from './components/ConfigScreen';
import GameScreen from './components/GameScreen';
import LobbyScreen from './multiplayer/LobbyScreen';
import MultiGameScreen from './multiplayer/MultiGameScreen';
import { createRoom, joinRoom } from './firebase/rooms';
import { getPlayerId } from './firebase/config';

type Screen =
  | { type: 'config' }
  | { type: 'game'; config: DeckConfig }
  | { type: 'lobby' }
  | { type: 'online'; roomId: string; playerId: string }
  | { type: 'rejoin'; roomId: string };

function getRoomFromHash(): string | null {
  const match = window.location.hash.match(new RegExp('^#room/([A-Z0-9]{' + ROOM_CODE_LENGTH + '})$'));
  return match ? match[1] : null;
}

function setRoomHash(roomId: string) {
  window.location.hash = `room/${roomId}`;
}

function clearRoomHash() {
  history.replaceState(null, '', window.location.pathname);
}

export default function App() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>(() => {
    const roomId = getRoomFromHash();
    if (roomId) return { type: 'rejoin', roomId };
    return { type: 'config' };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (screen.type !== 'rejoin') return;
    const roomId = screen.roomId;
    (async () => {
      try {
        const playerId = await getPlayerId();
        setScreen({ type: 'online', roomId, playerId });
      } catch (e) {
        console.error('Failed to rejoin room:', e);
        clearRoomHash();
        setScreen({ type: 'config' });
      }
    })();
  }, [screen.type]);

  function navigateTo(s: Screen) {
    if (s.type === 'online') {
      setRoomHash(s.roomId);
    } else {
      clearRoomHash();
    }
    setScreen(s);
  }

  async function handleCreateRoom(name: string) {
    setLoading(true);
    setError('');
    try {
      const { roomId, playerId } = await createRoom(name);
      navigateTo({ type: 'online', roomId, playerId });
    } catch (e) {
      setError(t('error.createRoom'));
      console.error(e);
    }
    setLoading(false);
  }

  async function handleJoinRoom(roomId: string, name: string) {
    setLoading(true);
    setError('');
    try {
      const result = await joinRoom(roomId, name);
      if (result) {
        navigateTo({ type: 'online', roomId, playerId: result.playerId });
      } else {
        setError(t('error.roomNotFound'));
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE_NAME') {
        setError(t('error.duplicateName'));
      } else if (e instanceof Error && e.message === 'ROOM_FULL') {
        setError(t('error.roomFull'));
      } else {
        setError(t('error.joinRoom'));
      }
      console.error(e);
    }
    setLoading(false);
  }

  switch (screen.type) {
    case 'rejoin':
      return (
        <div className="screen active">
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
            {t('multi.loadingRoom')}
          </div>
        </div>
      );

    case 'config':
      return (
        <ConfigScreen
          onStart={(config) => navigateTo({ type: 'game', config })}
          onMultiplayer={() => navigateTo({ type: 'lobby' })}
        />
      );

    case 'game':
      return (
        <GameScreen
          config={screen.config}
          onBack={() => navigateTo({ type: 'config' })}
        />
      );

    case 'lobby':
      return (
        <LobbyScreen
          onBack={() => navigateTo({ type: 'config' })}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          loading={loading}
          error={error}
        />
      );

    case 'online':
      return (
        <MultiGameScreen
          roomId={screen.roomId}
          playerId={screen.playerId}
          onBack={() => navigateTo({ type: 'config' })}
        />
      );
  }
}
