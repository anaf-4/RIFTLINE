import { useState } from 'react';
import { useT } from '../../i18n/useT';

interface Step {
  titleKey: 'tutorial_line_title' | 'tutorial_energy_title' | 'tutorial_move_title' | 'tutorial_intent_title' | 'tutorial_endturn_title';
  bodyKey: 'tutorial_line_body' | 'tutorial_energy_body' | 'tutorial_move_body' | 'tutorial_intent_body' | 'tutorial_endturn_body';
}

const STEPS: Step[] = [
  { titleKey: 'tutorial_line_title', bodyKey: 'tutorial_line_body' },
  { titleKey: 'tutorial_energy_title', bodyKey: 'tutorial_energy_body' },
  { titleKey: 'tutorial_move_title', bodyKey: 'tutorial_move_body' },
  { titleKey: 'tutorial_intent_title', bodyKey: 'tutorial_intent_body' },
  { titleKey: 'tutorial_endturn_title', bodyKey: 'tutorial_endturn_body' },
];

export default function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const t = useT();
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(8,9,13,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: '86%',
          background: 'var(--panel)',
          border: '1px solid var(--accent)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>
          {step + 1} / {STEPS.length}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: 'var(--accent)' }}>{t(current.titleKey)}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-main)', marginBottom: 20 }}>{t(current.bodyKey)}</div>
        <button className="btn btn-accent" onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}>
          {isLast ? t('got_it') : t('next')}
        </button>
      </div>
    </div>
  );
}
