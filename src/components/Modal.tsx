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
}

export default function Modal({ open, title, onClose, onSelect, options, energyCounts }: Props) {
  const { t, energyName } = useI18n();

  if (!open) return null;

  const items: ModalOption[] = options || ENERGY_TYPES.map(type => ({
    id: type.id,
    label: energyName(type.id),
    icon: type.id,
    count: energyCounts?.[type.id] || 0,
    disabled: !(energyCounts?.[type.id]),
  }));

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <ul className="modal-energy-list">
          {items.map(item => (
            <li
              key={item.id}
              className={item.disabled ? 'disabled' : ''}
              onClick={() => !item.disabled && onSelect(item.id)}
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
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('modal.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
