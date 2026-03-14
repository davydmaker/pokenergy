import { useState, useEffect, useCallback } from 'react';
import type { Room } from '../game/types';
import { subscribeToRoom, passTurn, setRoomStatus, initPlayerGameState, syncPlayerGameState, joinRoom } from '../firebase/rooms';
import { gameReducer, initialReducerState } from '../game/reducer';
import { useI18n } from '../i18n/context';
import ConfigScreen from '../components/ConfigScreen';
import GameScreen from '../components/GameScreen';

interface Props {
  roomId: string;
  playerId: string;
  onBack: () => void;
}

export default function MultiGameScreen({ roomId, playerId, onBack }: Props) {
  const { t } = useI18n();
  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<'waiting' | 'config' | 'playing'>('waiting');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let mounted = true;
    const unsub = subscribeToRoom(roomId, (r) => {
      if (!mounted) return;
      setRoom(r);
      if (r?.status === 'configuring') setPhase('config');
      if (r?.status === 'playing') setPhase('playing');
    });
    return () => { mounted = false; unsub(); };
  }, [roomId]);

  const isHost = room?.hostId === playerId;
  const players = room ? Object.values(room.players) : [];
  const myPlayer = room?.players[playerId];
  const isMyTurn = room?.currentTurn === playerId;

  const handleStartConfig = useCallback(async () => {
    await setRoomStatus(roomId, 'configuring');
  }, [roomId]);

  const handlePassTurn = useCallback(async () => {
    await passTurn(roomId, playerId);
  }, [roomId, playerId]);

  async function handleJoinFromUrl() {
    if (!joinName.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await joinRoom(roomId, joinName.trim());
      if (!result) {
        setJoinError(t('error.roomNotFound'));
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE_NAME') {
        setJoinError(t('error.duplicateName'));
      } else if (e instanceof Error && e.message === 'ROOM_FULL') {
        setJoinError(t('error.roomFull'));
      } else {
        setJoinError(t('error.joinRoom'));
      }
    }
    setJoining(false);
  }

  if (!room) {
    return (
      <div className="screen active">
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>{t('multi.loadingRoom')}</div>
      </div>
    );
  }

  if (!myPlayer) {
    if (room.status !== 'waiting') {
      return (
        <div className="screen active">
          <div className="logo">{t('multi.room', { id: roomId })}</div>
          <div className="config-group" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-dim)' }}>{t('error.roomNotFound')}</div>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>{t('lobby.back')}</button>
        </div>
      );
    }

    return (
      <div className="screen active">
        <div className="logo">{t('multi.room', { id: roomId })}</div>
        <div className="config-group">
          <label>{t('multi.players')}</label>
          {players.map(p => (
            <div key={p.id} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.connected ? 'var(--success)' : '#555' }} />
              <span>{p.name}</span>
              {p.id === room.hostId && <span className="text-dim" style={{ fontSize: '0.75rem' }}>{t('multi.host')}</span>}
            </div>
          ))}
        </div>
        <div className="config-group">
          <label>{t('lobby.yourName')}</label>
          <div className="config-row">
            <input
              type="text"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              placeholder={t('lobby.namePlaceholder')}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--input-border)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '1rem' }}
              onKeyDown={e => e.key === 'Enter' && handleJoinFromUrl()}
            />
          </div>
          {joinError && <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 8 }}>{joinError}</div>}
          <button
            className="btn btn-primary"
            disabled={!joinName.trim() || joining}
            onClick={handleJoinFromUrl}
          >
            {joining ? t('lobby.joining') : t('lobby.joinRoom')}
          </button>
        </div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 8 }}>{t('lobby.back')}</button>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="screen active">
        <div className="logo">{t('multi.room', { id: roomId })}</div>
        <div className="config-group">
          <label>{t('multi.players')}</label>
          {players.map(p => (
            <div key={p.id} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #ffffff10' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.connected ? 'var(--success)' : '#555' }} />
              <span>{p.name}</span>
              {p.id === room.hostId && <span className="text-dim" style={{ fontSize: '0.75rem' }}>{t('multi.host')}</span>}
            </div>
          ))}
        </div>

        <div className="config-group" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 8 }}>
            {t('multi.shareCode')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.2em', color: 'var(--warning)' }}>
            {roomId}
          </div>
        </div>

        {isHost && players.length >= 2 && (
          <button className="btn btn-primary" onClick={handleStartConfig} style={{ marginBottom: 10 }}>
            {t('multi.startConfig')}
          </button>
        )}
        {isHost && players.length < 2 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: 8 }}>
            {t('multi.waitingPlayers')}
          </div>
        )}
        {!isHost && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: 8 }}>
            {t('multi.waitingHost')}
          </div>
        )}

        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 8 }}>{t('multi.leaveRoom')}</button>
      </div>
    );
  }

  if (phase === 'config' && !myPlayer?.ready) {
    return (
      <ConfigScreen
        title={t('multi.room', { id: roomId })}
        startLabel={t('config.confirmDeck')}
        onStart={async (config) => {
          const result = gameReducer(initialReducerState, { type: 'INIT_GAME', config });
          await initPlayerGameState(roomId, playerId, result.current);

          const allReady = players.every(p => p.id === playerId ? true : p.ready);
          if (allReady && isHost) {
            await setRoomStatus(roomId, 'playing');
          }
        }}
      />
    );
  }

  if (phase === 'config' && myPlayer?.ready) {
    const notReady = players.filter(p => !p.ready);
    return (
      <div className="screen active">
        <div className="logo">{t('multi.waiting')}</div>
        <div className="config-group" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-dim)', marginBottom: 12 }}>
            {t('multi.deckReady')}
          </div>
          {notReady.length > 0 && (
            <div style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
              {t('multi.waitingFor', { names: notReady.map(p => p.name).join(', ') })}
            </div>
          )}
          {notReady.length === 0 && isHost && (
            <button className="btn btn-primary" onClick={() => setRoomStatus(roomId, 'playing')}>
              {t('multi.startGame')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && myPlayer?.gameState) {
    const opponentHistories = players
      .filter(p => p.id !== playerId && p.gameState?.history)
      .map(p => ({ name: p.name, history: p.gameState.history, deckCount: p.gameState.deck.length }));

    return (
      <GameScreen
        config={myPlayer.gameState.config}
        onBack={onBack}
        playerName={myPlayer.name}
        isMyTurn={isMyTurn}
        onPassTurn={handlePassTurn}
        opponentHistories={opponentHistories}
        onStateChange={(gs) => syncPlayerGameState(roomId, playerId, gs)}
      />
    );
  }

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>{t('multi.loading')}</div>
    </div>
  );
}
