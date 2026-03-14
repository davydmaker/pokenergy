import { ENERGY_TYPES } from '../game/types';
import { useI18n } from '../i18n/context';
import EnergyIcon from './EnergyIcon';

interface Props {
  counts: Record<string, number>;
  emptyText?: string;
}

export default function EnergyBar({ counts, emptyText }: Props) {
  const { t } = useI18n();
  const hasAny = Object.values(counts).some(v => v > 0);

  if (!hasAny) {
    return <span className="text-dim" style={{ fontSize: '0.8rem' }}>{emptyText || t('energyBar.empty')}</span>;
  }

  return (
    <div className="energy-bar">
      {ENERGY_TYPES.map(type => {
        const count = counts[type.id] || 0;
        if (count === 0) return null;
        return (
          <div key={type.id} className="energy-badge">
            <EnergyIcon typeId={type.id} size="sm" />
            {count}
          </div>
        );
      })}
    </div>
  );
}
