import InfoModal from './InfoModal';
import { STATUS_INFO, ELEMENT_INFO, ELEMENT_REACTION_TEXT, LINE_INFO } from '../../i18n/glossary';
import { statusIcon } from './statusIcons';
import type { Locale } from '../../i18n/strings';

const ELEMENT_ICON: Record<string, string> = { fire: '🔥', ice: '❄', lightning: '⚡' };

export default function GlossaryModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  return (
    <InfoModal title={locale === 'ko' ? '용어 설명' : 'Glossary'} onClose={onClose}>
      <div className="rl-info-section">
        <div className="rl-info-section-title">{locale === 'ko' ? '라인 시스템' : 'Line System'}</div>
        <div>{LINE_INFO[locale]}</div>
      </div>

      <div className="rl-info-section">
        <div className="rl-info-section-title">{locale === 'ko' ? '속성 마커' : 'Element Marks'}</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
          {(Object.keys(ELEMENT_INFO) as (keyof typeof ELEMENT_INFO)[]).map((id) => (
            <span key={id}>
              {ELEMENT_ICON[id]} {ELEMENT_INFO[id][locale]}
            </span>
          ))}
        </div>
        <div>{ELEMENT_REACTION_TEXT[locale]}</div>
      </div>

      <div className="rl-info-section">
        <div className="rl-info-section-title">{locale === 'ko' ? '상태 효과' : 'Status Effects'}</div>
        {(Object.keys(STATUS_INFO) as (keyof typeof STATUS_INFO)[]).map((id) => (
          <div className="rl-info-row" key={id}>
            <span className="rl-info-row-icon">{statusIcon[id] ?? '?'}</span>
            <span>{STATUS_INFO[id][locale]}</span>
          </div>
        ))}
      </div>
    </InfoModal>
  );
}
