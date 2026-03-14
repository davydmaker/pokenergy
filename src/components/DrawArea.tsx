import { useI18n } from '../i18n/context';
import EnergyIcon from './EnergyIcon';

interface DrawResult {
  type: 'energy' | 'not-energy' | 'empty' | 'shuffle' | 'undo' | 'init';
  energyId?: string;
  handEnergies?: string[];
  initialHandSize?: number;
}

interface Props {
  result: DrawResult | null;
}

export default function DrawArea({ result }: Props) {
  const { t, energyName } = useI18n();

  if (!result) {
    return (
      <div className="draw-area">
        <div className="draw-result">{t('draw.start')}</div>
      </div>
    );
  }

  return (
    <div className="draw-area">
      {result.type === 'energy' && result.energyId && (() => {
        return (
          <>
            <div className="draw-result animate-in" style={{ color: 'var(--warning)' }}>{t('draw.basicEnergy')}</div>
            <div className="animate-in pulse" style={{ margin: '12px 0' }}>
              <EnergyIcon typeId={result.energyId} size="lg" />
            </div>
            <div className="animate-in" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{energyName(result.energyId)}</div>
            <div className="draw-hint">{t('draw.dontDraw')}</div>
          </>
        );
      })()}

      {result.type === 'not-energy' && (
        <>
          <div className="draw-result animate-in" style={{ color: 'var(--success)' }}>{t('draw.notEnergy')}</div>
          <svg className="animate-in" width="64" height="64" viewBox="0 0 24 24" fill="var(--success)" style={{ margin: '12px 0' }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <div className="draw-hint">{t('draw.canDraw')}</div>
        </>
      )}

      {result.type === 'empty' && (
        <div className="draw-result animate-in">{t('draw.deckEmpty')}</div>
      )}

      {result.type === 'shuffle' && (
        <>
          <div className="draw-result animate-in">{t('draw.shuffled')}</div>
          <svg className="animate-in pulse" width="64" height="64" viewBox="0 0 24 24" fill="var(--warning)" style={{ margin: '12px 0' }}>
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
          </svg>
        </>
      )}

      {result.type === 'undo' && (
        <>
          <div className="draw-result animate-in">{t('draw.undone')}</div>
          <svg className="animate-in" width="48" height="48" viewBox="0 0 24 24" fill="var(--text-dim)" style={{ margin: '12px 0' }}>
            <path d="M12.5 8c-2.65 0-5.05 1.04-6.83 2.74L3 8v8h8l-2.81-2.81C9.73 11.82 11.05 11 12.5 11c2.48 0 4.57 1.73 5.13 4H20c-.6-3.42-3.6-6-7.2-6z" />
          </svg>
        </>
      )}

      {result.type === 'init' && (
        <>
          <div className="draw-result animate-in">{t('draw.initialHand', { count: result.initialHandSize || 0 })}</div>
          {result.handEnergies && result.handEnergies.length > 0 ? (
            <>
              <div className="animate-in" style={{ fontSize: '0.95rem', color: 'var(--warning)' }}>
                {t('draw.energiesInHand', { count: result.handEnergies.length })}
              </div>
              {result.handEnergies.map((id, i) => {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', margin: '2px 0' }}>
                    <EnergyIcon typeId={id} size="sm" /> {energyName(id)}
                  </div>
                );
              })}
              <div className="draw-hint">{t('draw.useMarker')}</div>
            </>
          ) : (
            <div className="animate-in" style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{t('draw.noEnergyInitial')}</div>
          )}
        </>
      )}
    </div>
  );
}

export type { DrawResult };
