import type { HistoryEntry } from '../game/types';
import { HISTORY_DISPLAY_LIMIT } from '../game/constants';
import { useI18n } from '../i18n/context';

interface Props {
  history: HistoryEntry[];
}

export default function HistoryLog({ history }: Props) {
  const { t, energyName } = useI18n();

  function resolveParams(params?: Record<string, string | number>) {
    if (!params) return params;
    const resolved = { ...params };
    if (typeof resolved.name === 'string') {
      resolved.name = energyName(resolved.name);
    }
    return resolved;
  }

  return (
    <div className="panel history">
      <h3>{t('game.history')}</h3>
      {history.filter(h => !h.publicOnly).slice(0, HISTORY_DISPLAY_LIMIT).map((h, i) => (
        <div key={i} className={`history-item ${h.isEnergy ? 'energy' : 'not-energy'}`}>
          {h.time} - {t(h.key as any, resolveParams(h.params))}
        </div>
      ))}
    </div>
  );
}
