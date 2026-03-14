import { useI18n } from '../i18n/context';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: Props) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>
        <h3>{t('help.title')}</h3>

        <div className="help-section">
          <h4>{t('help.whatIsTitle')}</h4>
          <p>{t('help.whatIsDesc')}</p>
        </div>

        <div className="help-section">
          <h4>{t('help.setupTitle')}</h4>
          <p>{t('help.setupDesc')}</p>
        </div>

        <div className="help-section">
          <h4>{t('help.buttonsTitle')}</h4>
          <ul className="help-list">
            <li><strong>{t('game.drawCard')}</strong> — {t('help.btnDraw')}</li>
            <li><strong>{t('game.shuffle')}</strong> — {t('help.btnShuffle')}</li>
            <li><strong>{t('game.discardFromHand')}</strong> — {t('help.btnDiscard')}</li>
            <li><strong>{t('game.recoverDiscard')}</strong> — {t('help.btnRecover')}</li>
            <li><strong>{t('game.shuffleHand')}</strong> — {t('help.btnShuffleHand')}</li>
            <li><strong>{t('game.undo')}</strong> — {t('help.btnUndo')}</li>
          </ul>
        </div>

        <div className="help-section">
          <h4>{t('help.markersTitle')}</h4>
          <p>{t('help.markersDesc')}</p>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>{t('help.gotIt')}</button>
        </div>
      </div>
    </div>
  );
}
