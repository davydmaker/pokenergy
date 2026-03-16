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
import HelpModal from './HelpModal';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [searchDestModal, setSearchDestModal] = useState<string | null>(null);
  const [discardFromPlayModal, setDiscardFromPlayModal] = useState(false);
  const [recoverToDeckModal, setRecoverToDeckModal] = useState(false);
  const [handToPlayModal, setHandToPlayModal] = useState(false);
  const [drewThisTurn, setDrewThisTurn] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const prevIsMyTurn = useRef(isMyTurn);
  useEffect(() => {
    if (isMyTurn === true && prevIsMyTurn.current === false) {
      setDrewThisTurn(false);
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn]);

  const turnBlocked = isMyTurn === false;

  const executeDraw = useCallback(() => {
    if (gs.deck.length === 0) {
      setDrawResult({ type: 'empty' });
      return;
    }
    const card = gs.deck[0];
    const energyId = getEnergyId(card);
    dispatch({ type: 'DRAW_CARD' });
    setDrawResult(energyId ? { type: 'energy', energyId } : { type: 'not-energy' });
    setDrewThisTurn(true);
  }, [gs.deck]);

  const handleDraw = useCallback(() => {
    if (turnBlocked) return;
    if (drewThisTurn) {
      setConfirmDraw(true);
      return;
    }
    executeDraw();
  }, [turnBlocked, drewThisTurn, executeDraw]);

  const handleShuffle = useCallback(() => {
    if (turnBlocked) return;
    dispatch({ type: 'SHUFFLE_DECK' });
    setDrawResult({ type: 'shuffle' });
  }, [turnBlocked]);

  const handleUndo = useCallback(() => {
    if (turnBlocked) return;
    if (state.undoStack.length === 0) return;
    setConfirmUndo(true);
  }, [state.undoStack.length, turnBlocked]);

  const handleSearchSelect = useCallback((typeId: string) => {
    setSearchModal(false);
    setSearchDestModal(typeId);
  }, []);

  const handleSearchDestination = useCallback((dest: 'hand' | 'play') => {
    if (!searchDestModal) return;
    dispatch({ type: dest === 'hand' ? 'SEARCH_DECK_TO_HAND' : 'SEARCH_DECK_TO_PLAY', typeId: searchDestModal });
    setSearchDestModal(null);
  }, [searchDestModal]);

  const handleDiscardFromPlay = useCallback((typeId: string) => {
    dispatch({ type: 'DISCARD_FROM_PLAY', typeId });
    setDiscardFromPlayModal(false);
  }, []);

  const handleRecoverToDeck = useCallback((typeId: string) => {
    dispatch({ type: 'RECOVER_DISCARD_TO_DECK', typeId });
    setRecoverToDeckModal(false);
  }, []);

  const handleHandToPlay = useCallback((typeId: string) => {
    dispatch({ type: 'HAND_TO_PLAY', typeId });
    setHandToPlayModal(false);
  }, []);

  const handleFlipCoin = useCallback(() => {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    dispatch({ type: 'FLIP_COIN', result });
    setDrawResult({ type: 'coin', result });
  }, []);

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

  const deckEnergyCounts = countEnergiesInDeck(gs.deck);
  const inPlayCounts: Record<string, number> = {};
  let inPlayTotal = 0;
  for (const [id, total] of Object.entries(gs.config.energyCounts)) {
    if (total <= 0) continue;
    const count = total - (deckEnergyCounts[id] || 0) - (gs.hand[id] || 0) - (discardCounts[id] || 0);
    if (count > 0) { inPlayCounts[id] = count; inPlayTotal += count; }
  }

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
    if (resolved.result === 'heads') resolved.result = t('hist.coinHeads');
    if (resolved.result === 'tails') resolved.result = t('hist.coinTails');
    return resolved;
  }

  return (
    <div className="screen active">
      <div className="game-header">
        <button className="back-btn" onClick={() => setConfirmExit(true)}>
          &#8592;
        </button>
        <button className="help-btn help-btn-game" onClick={() => setHelpOpen(true)} aria-label="Help">?</button>
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
        <button className="btn btn-secondary" onClick={() => setSearchModal(true)} disabled={turnBlocked}>{t('game.searchDeck')}</button>
        <button className="btn btn-secondary" onClick={() => setDiscardFromPlayModal(true)} disabled={turnBlocked}>{t('game.discardFromPlay')}</button>
        <button className="btn btn-secondary" onClick={() => setRecoverToDeckModal(true)} disabled={turnBlocked}>{t('game.recoverToDeck')}</button>
        <button className="btn btn-secondary" onClick={() => setHandToPlayModal(true)} disabled={turnBlocked}>{t('game.handToPlay')}</button>
        <button className="btn btn-warning" onClick={handleFlipCoin}>{t('game.flipCoin')}</button>
        <button className="btn btn-secondary" onClick={handleUndo} disabled={turnBlocked}>{t('game.undo')}</button>
      </div>

      {inPlayTotal > 0 && (
        <div className="panel">
          <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
            {t('game.inPlay')} <span style={{ fontSize: '0.8rem' }}>{inPlayTotal} {t('game.energyCount')}</span>
          </h3>
          <EnergyBar counts={inPlayCounts} />
        </div>
      )}

      <div className="panel">
        <h3>{t('game.energiesInDeck')}</h3>
        <EnergyBar counts={deckEnergyCounts} emptyText={t('game.noEnergyInDeck')} />
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

      <Modal
        open={searchModal}
        title={t('modal.searchDeck')}
        onClose={() => setSearchModal(false)}
        onSelect={handleSearchSelect}
        energyCounts={deckEnergyCounts}
      />

      {searchDestModal && (
        <div className="modal-overlay" onClick={() => setSearchDestModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('modal.searchDestination')}</h3>
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <button className="btn btn-primary" onClick={() => handleSearchDestination('hand')}>
                {t('modal.toHand')}
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7 }}>{t('modal.toHandDesc')}</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleSearchDestination('play')}>
                {t('modal.toPlay')}
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7 }}>{t('modal.toPlayDesc')}</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setSearchDestModal(null)}>{t('modal.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={discardFromPlayModal}
        title={t('modal.discardFromPlay')}
        onClose={() => setDiscardFromPlayModal(false)}
        onSelect={handleDiscardFromPlay}
        energyCounts={inPlayCounts}
      />

      <Modal
        open={recoverToDeckModal}
        title={t('modal.recoverToDeck')}
        onClose={() => setRecoverToDeckModal(false)}
        onSelect={handleRecoverToDeck}
        energyCounts={discardCounts}
      />

      <Modal
        open={handToPlayModal}
        title={t('modal.handToPlay')}
        onClose={() => setHandToPlayModal(false)}
        onSelect={handleHandToPlay}
        energyCounts={gs.hand}
      />

      {confirmExit && (
        <div className="modal-overlay" onClick={() => setConfirmExit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('modal.confirmExitTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 12, textAlign: 'center' }}>
              {t('game.confirmExit')}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmExit(false)}>{t('modal.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { setConfirmExit(false); onBack(); }}>{t('modal.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDraw && (
        <div className="modal-overlay" onClick={() => setConfirmDraw(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('modal.confirmDrawTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 12, textAlign: 'center' }}>
              {t('modal.confirmDrawDesc')}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDraw(false)}>{t('modal.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { setConfirmDraw(false); executeDraw(); }}>{t('modal.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {confirmUndo && (
        <div className="modal-overlay" onClick={() => setConfirmUndo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('modal.confirmUndoTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 12, textAlign: 'center' }}>
              {t('modal.confirmUndoDesc')}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmUndo(false)}>{t('modal.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { setConfirmUndo(false); dispatch({ type: 'UNDO' }); setDrawResult({ type: 'undo' }); }}>{t('modal.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
