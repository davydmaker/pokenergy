import { ENERGY_TYPES } from '../game/types';
import { useI18n } from '../i18n/context';
import EnergyIcon from './EnergyIcon';

interface Props {
  hand: Record<string, number>;
}

export default function HandTracker({ hand }: Props) {
  const { t, energyName } = useI18n();
  const totalInHand = Object.values(hand).reduce((a, b) => a + b, 0);

  return (
    <div className="panel hand-tracker">
      <h3>
        {t('hand.title')}
        <span className="hand-total">{totalInHand}</span>
      </h3>
      {totalInHand === 0 ? (
        <span className="text-dim" style={{ fontSize: '0.8rem' }}>{t('hand.empty')}</span>
      ) : (
        <div className="energy-bar">
          {ENERGY_TYPES.map(type => {
            const count = hand[type.id] || 0;
            if (count === 0) return null;
            return (
              <div key={type.id} className="energy-badge">
                <EnergyIcon typeId={type.id} size="sm" />
                {energyName(type.id)} x{count}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
