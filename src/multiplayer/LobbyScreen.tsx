import { useState } from 'react';
import { ROOM_CODE_LENGTH } from '../game/constants';
import { useI18n } from '../i18n/context';

interface Props {
  onBack: () => void;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  loading?: boolean;
  error?: string;
}

export default function LobbyScreen({ onBack, onCreateRoom, onJoinRoom, loading, error }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  return (
    <div className="screen active">
      <div className="logo">{t('lobby.title')}</div>

      {mode === 'menu' && (
        <>
          <div className="config-group">
            <label>{t('lobby.playOnline')}</label>
            <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={() => setMode('create')}>
              {t('lobby.createRoom')}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              {t('lobby.joinRoom')}
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 8 }}>{t('lobby.back')}</button>
        </>
      )}

      {mode === 'create' && (
        <div className="config-group">
          <label>{t('lobby.yourName')}</label>
          <div className="config-row">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('lobby.namePlaceholder')}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid #333', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '1rem' }}
            />
          </div>
          {error && <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 8 }}>{error}</div>}
          <button
            className="btn btn-primary"
            disabled={!name.trim() || loading}
            onClick={() => onCreateRoom(name.trim())}
            style={{ marginBottom: 8 }}
          >
            {loading ? t('lobby.creating') : t('lobby.createRoom')}
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="config-group">
          <label>{t('lobby.yourName')}</label>
          <div className="config-row">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('lobby.namePlaceholder')}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid #333', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '1rem' }}
            />
          </div>
          <label>{t('lobby.roomCode')}</label>
          <div className="config-row">
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder={t('lobby.codePlaceholder')}
              maxLength={ROOM_CODE_LENGTH}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid #333', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.2em' }}
            />
          </div>
          {error && <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 8 }}>{error}</div>}
          <button
            className="btn btn-primary"
            disabled={!name.trim() || roomCode.length < ROOM_CODE_LENGTH || loading}
            onClick={() => onJoinRoom(roomCode, name.trim())}
            style={{ marginBottom: 8 }}
          >
            {loading ? t('lobby.joining') : t('lobby.join')}
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
        </div>
      )}
    </div>
  );
}
