import { useState } from 'react';
import type { DeckConfig } from '../game/types';
import { ENERGY_TYPES } from '../game/types';
import { DECK_DEFAULTS, DECK_LIMITS } from '../game/constants';
import { useI18n } from '../i18n/context';
import LanguageSwitcher from './LanguageSwitcher';
import EnergyIcon from './EnergyIcon';

interface Props {
  onStart: (config: DeckConfig) => void;
  onMultiplayer?: () => void;
  startLabel?: string;
  title?: string;
}

export default function ConfigScreen({ onStart, onMultiplayer, startLabel, title }: Props) {
  const { t, energyName } = useI18n();
  const [deckSize, setDeckSize] = useState<number>(DECK_DEFAULTS.deckSize);
  const [totalEnergy, setTotalEnergy] = useState<number>(DECK_DEFAULTS.totalEnergy);
  const [energyCounts, setEnergyCounts] = useState<Record<string, number>>(() => {
    const c: Record<string, number> = {};
    ENERGY_TYPES.forEach(t => c[t.id] = 0);
    return c;
  });
  const [prizeCount, setPrizeCount] = useState<number>(DECK_DEFAULTS.prizeCount);
  const [initialHand, setInitialHand] = useState<number>(DECK_DEFAULTS.initialHand);

  const configuredTotal = Object.values(energyCounts).reduce((a, b) => a + b, 0);
  const canStart = configuredTotal === totalEnergy;

  function setEnergyCount(id: string, val: number) {
    const othersTotal = Object.entries(energyCounts).reduce((sum, [k, v]) => k === id ? sum : sum + v, 0);
    const maxForThis = Math.max(0, totalEnergy - othersTotal);
    const clamped = Math.min(maxForThis, Math.max(0, val));
    setEnergyCounts(prev => ({ ...prev, [id]: clamped }));
  }

  function handleStart() {
    onStart({ deckSize, totalEnergy, energyCounts, prizeCount, initialHand });
  }

  return (
    <div className="screen active">
      <LanguageSwitcher />
      <div className="logo">{title || t('config.title')}</div>
      <h2>{t('config.subtitle')}</h2>

      <div className="config-group">
        <label>{t('config.deckSize')}</label>
        <div className="config-row">
          <input type="number" value={deckSize} min={DECK_LIMITS.deckSize.min} max={DECK_LIMITS.deckSize.max} onChange={e => setDeckSize(Math.max(DECK_LIMITS.deckSize.min, Math.min(DECK_LIMITS.deckSize.max, parseInt(e.target.value) || DECK_LIMITS.deckSize.min)))} />
          <span className="text-dim" style={{ fontSize: '0.85rem' }}>{t('config.deckSizeHint')}</span>
        </div>
      </div>

      <div className="config-group">
        <label>{t('config.totalEnergy')}</label>
        <div className="config-row">
          <input type="number" value={totalEnergy} min={0} max={deckSize} onChange={e => setTotalEnergy(Math.max(0, Math.min(deckSize, parseInt(e.target.value) || 0)))} />
          <span className="text-dim" style={{ fontSize: '0.85rem' }}>{t('config.totalEnergyHint')}</span>
        </div>
      </div>

      <div className="config-group">
        <label>{t('config.distribution')}</label>
        {ENERGY_TYPES.map(type => (
          <div key={type.id} className="energy-config-item">
            <EnergyIcon typeId={type.id} />
            <div className="energy-name">{energyName(type.id)}</div>
            <div className="energy-count-controls">
              <button onClick={() => setEnergyCount(type.id, energyCounts[type.id] - 1)}>-</button>
              <input
                type="number"
                className="energy-count-input"
                value={energyCounts[type.id]}
                min={0}
                onInput={e => setEnergyCount(type.id, parseInt((e.target as HTMLInputElement).value) || 0)}
                onFocus={e => e.target.select()}
              />
              <button onClick={() => setEnergyCount(type.id, energyCounts[type.id] + 1)}>+</button>
            </div>
          </div>
        ))}
        <div className={`energy-total ${configuredTotal !== totalEnergy ? 'over' : ''}`}>
          {t('config.totalConfigured')} <span>{configuredTotal}</span> / <span>{totalEnergy}</span>
        </div>
      </div>

      <div className="config-group">
        <label>{t('config.prize')}</label>
        <div className="config-row">
          <input type="number" value={prizeCount} min={DECK_LIMITS.prizeCount.min} max={DECK_LIMITS.prizeCount.max} onChange={e => setPrizeCount(Math.max(DECK_LIMITS.prizeCount.min, Math.min(DECK_LIMITS.prizeCount.max, parseInt(e.target.value) || DECK_LIMITS.prizeCount.min)))} />
          <span className="text-dim" style={{ fontSize: '0.85rem' }}>{t('config.prizeHint')}</span>
        </div>
      </div>

      <div className="config-group">
        <label>{t('config.initialHand')}</label>
        <div className="config-row">
          <input type="number" value={initialHand} min={DECK_LIMITS.initialHand.min} max={DECK_LIMITS.initialHand.max} onChange={e => setInitialHand(Math.max(DECK_LIMITS.initialHand.min, Math.min(DECK_LIMITS.initialHand.max, parseInt(e.target.value) || DECK_LIMITS.initialHand.min)))} />
          <span className="text-dim" style={{ fontSize: '0.85rem' }}>{t('config.initialHandHint')}</span>
        </div>
      </div>

      <button className="btn btn-primary" disabled={!canStart} onClick={handleStart} style={{ marginBottom: 10 }}>
        {startLabel || t('config.playSolo')}
      </button>
      {onMultiplayer && (
        <button className="btn btn-secondary" onClick={onMultiplayer}>
          {t('config.multiplayer')}
        </button>
      )}

      <footer className="footer">
        <div className="footer-legal">
          {t('footer.legal')}
        </div>
        <div className="footer-credits">
          <a href="https://github.com/davydmaker/pokenergy" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          {' '}{t('footer.madeWith')}{' '}
          <svg className="heart" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          {' '}{t('footer.by')} <a href="https://davydmaker.com" target="_blank" rel="noopener noreferrer">dvd</a>
        </div>
      </footer>
    </div>
  );
}
