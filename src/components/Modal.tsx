import { ENERGY_TYPES } from '../game/types';
import { useI18n } from '../i18n/context';
import EnergyIcon from './EnergyIcon';

interface ModalOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  options?: ModalOption[];
  energyCounts?: Record<string, number>;
  emptyText?: string;
}

export default function Modal({ open, title, onClose, onSelect, options, energyCounts, emptyText }: Props) {
  const { t, energyName } = useI18n();

  if (!open) return null;

  const items: ModalOption[] = options || ENERGY_TYPES
    .filter(type => (energyCounts?.[type.id] || 0) > 0)
    .map(type => ({
      id: type.id,
      label: energyName(type.id),
      icon: type.id,
      count: energyCounts?.[type.id] || 0,
    }));

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', padding: '16px 0' }}>
            {emptyText || t('modal.noEnergies')}
          </p>
        ) : (
          <ul className="modal-energy-list">
            {items.map(item => (
              <li
                key={item.id}
                onClick={() => onSelect(item.id)}
              >
                {item.icon && <EnergyIcon typeId={item.icon} />}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
                    {item.count}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('modal.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
