import { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import type { DeckConfig, GameState, HistoryEntry } from '../game/types';
import { countEnergiesInDeck, totalEnergiesInDeck, getEnergyId } from '../game/engine';
import { OPPONENT_HISTORY_LIMIT } from '../game/constants';
import { gameReducer, initialReducerState } from '../game/reducer';
import { useI18n } from '../i18n/context';
import DrawArea, { type DrawResult } from './DrawArea';
import HandTracker from './HandTracker';
import EnergyBar from './EnergyBar';
import HistoryLog from './HistoryLog';
import Modal from './Modal';

interface Props {
  config: DeckConfig;
  onBack: () => void;
  playerName?: string;
  isMyTurn?: boolean;
  onPassTurn?: () => void;
  opponentHistories?: { name: string; history: HistoryEntry[]; deckCount: number }[];
  onStateChange?: (state: GameState) => void;
}

export default function GameScreen({ config, onBack, playerName, isMyTurn, onPassTurn, opponentHistories, onStateChange }: Props) {
  const { t, energyName } = useI18n();
  const [state, dispatch] = useReducer(gameReducer, initialReducerState, (initial) => {
    return gameReducer(initial, { type: 'INIT_GAME', config });
  });

  const gs = state.current;
  const isFirstRender = useRef(true);

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onStateChangeRef.current?.(gs);
  }, [gs]);

  const [drawResult, setDrawResult] = useState<DrawResult>(() => {
    const handEnergies = Object.entries(gs.hand).flatMap(([id, count]) => Array(count).fill(id));
    return { type: 'init', handEnergies, initialHandSize: config.initialHand };
  });
  const [modal, setModal] = useState<{ title: string; type: string } | null>(null);
  const [shuffleHandModal, setShuffleHandModal] = useState<{ drawCount: number } | null>(null);

  const turnBlocked = isMyTurn === false;

  const handleDraw = useCallback(() => {
    if (turnBlocked) return;
    if (gs.deck.length === 0) {
      setDrawResult({ type: 'empty' });
      return;
    }
    const card = gs.deck[0];
    const energyId = getEnergyId(card);
    dispatch({ type: 'DRAW_CARD' });
    setDrawResult(energyId ? { type: 'energy', energyId } : { type: 'not-energy' });
  }, [gs.deck, turnBlocked]);

  const handleShuffle = useCallback(() => {
    if (turnBlocked) return;
    dispatch({ type: 'SHUFFLE_DECK' });
    setDrawResult({ type: 'shuffle' });
  }, [turnBlocked]);

  const handleUndo = useCallback(() => {
    if (turnBlocked) return;
    if (state.undoStack.length === 0) return;
    dispatch({ type: 'UNDO' });
    setDrawResult({ type: 'undo' });
  }, [state.undoStack.length, turnBlocked]);

  const handleModalSelect = useCallback((typeId: string) => {
    if (!modal) return;
    switch (modal.type) {
      case 'discard':
        dispatch({ type: 'DISCARD_FROM_HAND', typeId });
        break;
      case 'recover':
        dispatch({ type: 'RECOVER_DISCARD', typeId });
        break;
    }
    setModal(null);
  }, [modal]);

  const discardCounts: Record<string, number> = {};
  gs.discardPile.forEach(id => { discardCounts[id] = (discardCounts[id] || 0) + 1; });

  function getModalCounts() {
    if (!modal) return {};
    switch (modal.type) {
      case 'discard': return gs.hand;
      case 'recover': return discardCounts;
      default: return {};
    }
  }

  function resolveHistoryParams(params?: Record<string, string | number>) {
    if (!params) return params;
    const resolved = { ...params };
    if (typeof resolved.name === 'string') {
      resolved.name = energyName(resolved.name);
    }
    return resolved;
  }

  return (
    <div className="screen active">
      <div className="game-header">
        <button className="back-btn" onClick={() => { if (confirm(t('game.confirmExit'))) onBack(); }}>
          &#8592;
        </button>
        <div className="deck-info">
          {playerName && <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.9rem' }}>{playerName}</div>}
          {t('game.deck')} <strong>{gs.deck.length}</strong> {t('game.cards')}
          &nbsp;|&nbsp;
          {t('game.energies')} <strong>{totalEnergiesInDeck(gs.deck)}</strong>
        </div>
        {onPassTurn && (
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.8rem' }}
            onClick={onPassTurn}
            disabled={turnBlocked}
          >
            {t('game.passTurn')}
          </button>
        )}
      </div>

      {turnBlocked && (
        <div style={{ textAlign: 'center', padding: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', background: 'var(--card)', borderRadius: 8, marginBottom: 12 }}>
          {t('game.waitingTurn')}
        </div>
      )}

      <DrawArea result={drawResult} />

      <HandTracker hand={gs.hand} />

      <div className="action-grid">
        <button className="btn btn-primary" onClick={handleDraw} disabled={turnBlocked}>{t('game.drawCard')}</button>
        <button className="btn btn-warning" onClick={handleShuffle} disabled={turnBlocked}>{t('game.shuffle')}</button>
        <button className="btn btn-secondary" onClick={() => setModal({ title: t('modal.discardFromHand'), type: 'discard' })} disabled={turnBlocked}>{t('game.discardFromHand')}</button>
        <button className="btn btn-secondary" onClick={() => setModal({ title: t('modal.recoverFromDiscard'), type: 'recover' })} disabled={turnBlocked}>{t('game.recoverDiscard')}</button>
        <button className="btn btn-secondary" onClick={() => setShuffleHandModal({ drawCount: Object.values(gs.hand).reduce((a, b) => a + b, 0) })} disabled={turnBlocked}>
          {t('game.shuffleHand')}
        </button>
        <button className="btn btn-secondary" onClick={handleUndo} disabled={turnBlocked}>{t('game.undo')}</button>
      </div>

      <div className="panel">
        <h3>{t('game.energiesInDeck')}</h3>
        <EnergyBar counts={countEnergiesInDeck(gs.deck)} emptyText={t('game.noEnergyInDeck')} />
      </div>

      <div className="panel">
        <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
          {t('game.discard')} <span style={{ fontSize: '0.8rem' }}>{gs.discardPile.length} {t('game.energyCount')}</span>
        </h3>
        <EnergyBar counts={discardCounts} />
      </div>

      {opponentHistories && opponentHistories.length > 0 && (
        <div className="panel">
          {opponentHistories.map((op, i) => (
            <div key={i} style={{ fontSize: '0.85rem', padding: '4px 0' }}>
              {t('game.opponentDeck', { name: op.name, count: op.deckCount })}
            </div>
          ))}
        </div>
      )}

      <HistoryLog history={gs.history} />

      {opponentHistories && opponentHistories.map((op, i) => {
        const publicHistory = op.history.filter(h => !h.private);
        return (
          <div key={i} className="panel history" style={{ borderLeft: '3px solid var(--accent)' }}>
            <h3>{op.name} - {t('game.history')}</h3>
            {publicHistory.slice(0, OPPONENT_HISTORY_LIMIT).map((h, j) => (
              <div key={j} className={`history-item ${h.isEnergy ? 'energy' : 'not-energy'}`}>
                {h.time} - {t(h.key as any, resolveHistoryParams(h.params))}
              </div>
            ))}
            {publicHistory.length === 0 && (
              <span className="text-dim" style={{ fontSize: '0.8rem' }}>{t('game.noActions')}</span>
            )}
          </div>
        );
      })}

      <Modal
        open={!!modal}
        title={modal?.title || ''}
        onClose={() => setModal(null)}
        onSelect={handleModalSelect}
        energyCounts={getModalCounts()}
      />

      {shuffleHandModal && (
        <div className="modal-overlay" onClick={() => setShuffleHandModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('modal.shuffleHandTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 12, textAlign: 'center' }}>
              {t('modal.shuffleHandDesc')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: '0.9rem' }}>{t('modal.howManyCards')}</label>
              <input
                type="number"
                value={shuffleHandModal.drawCount}
                min={0}
                max={gs.deck.length + Object.values(gs.hand).reduce((a, b) => a + b, 0)}
                onChange={e => setShuffleHandModal({ drawCount: Math.max(0, parseInt(e.target.value) || 0) })}
                style={{ width: 70 }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShuffleHandModal(null)}>{t('modal.cancel')}</button>
              <button className="btn btn-primary" onClick={() => {
                dispatch({ type: 'SHUFFLE_HAND_AND_DRAW', drawCount: shuffleHandModal.drawCount });
                setShuffleHandModal(null);
                setDrawResult({ type: 'shuffle' });
              }}>
                {t('modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
