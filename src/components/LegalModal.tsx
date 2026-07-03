import type { ReactNode } from 'react';
import { useI18n } from '../i18n/context';
import type { TranslationKey } from '../i18n/translations';

export type LegalType = 'terms' | 'privacy';

const LINK_PATTERN = /(https?:\/\/[^\s]+|[^\s@]+@[^\s@]+\.[^\s@]+)/g;

function linkify(text: string): ReactNode[] {
  return text.split(LINK_PATTERN).map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      const trailing = part.match(/[.,;:)]+$/)?.[0] ?? '';
      const url = trailing ? part.slice(0, -trailing.length) : part;
      return (
        <span key={i}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url.replace(/^https?:\/\//, '')}
          </a>
          {trailing}
        </span>
      );
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
      return <a key={i} href={`mailto:${part}`}>{part}</a>;
    }
    return part;
  });
}

interface Props {
  type: LegalType;
  open: boolean;
  onClose: () => void;
}

const SECTIONS: Record<LegalType, string[]> = {
  terms: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
  privacy: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'],
};

export default function LegalModal({ type, open, onClose }: Props) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>
        <h3>{t(`${type}.title` as TranslationKey)}</h3>
        <p className="legal-updated">{t(`${type}.updated` as TranslationKey)}</p>

        {SECTIONS[type].map(s => (
          <div className="help-section" key={s}>
            <h4>{t(`${type}.${s}Title` as TranslationKey)}</h4>
            <p>{linkify(t(`${type}.${s}Body` as TranslationKey))}</p>
          </div>
        ))}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>{t('legal.close')}</button>
        </div>
      </div>
    </div>
  );
}
