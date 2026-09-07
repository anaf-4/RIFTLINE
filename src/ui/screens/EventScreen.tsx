import { useGameStore } from '../../store/gameStore';
import { useT, useLocale } from '../../i18n/useT';

export default function EventScreen() {
  const game = useGameStore((s) => s.game);
  const eventChoose = useGameStore((s) => s.eventChoose);
  const eventResultAck = useGameStore((s) => s.eventResultAck);
  const t = useT();
  const locale = useLocale();
  const run = game.run;
  if (!run) return null;

  if (game.eventResult) {
    const { messageKo, messageEn, success } = game.eventResult;
    return (
      <div className="game-viewport">
        <div className="centered-screen" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="title-sub" style={{ fontSize: 16, lineHeight: 1.6, color: success ? 'var(--text-main)' : 'var(--hp)' }}>
            {locale === 'en' ? messageEn : messageKo}
          </div>
          <button className="btn btn-accent" onClick={eventResultAck}>
            {t('proceed')}
          </button>
        </div>
      </div>
    );
  }

  const ev = game.activeEvent;
  if (!ev) return null;

  return (
    <div className="game-viewport">
      <div className="centered-screen" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="title-logo" style={{ fontSize: 28 }}>
          {locale === 'en' ? ev.titleEn ?? ev.title : ev.title}
        </div>
        <div className="title-sub" style={{ fontSize: 15, lineHeight: 1.6 }}>
          {locale === 'en' ? ev.textEn ?? ev.text : ev.text}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {ev.choices.map((choice, i) => {
            const disabled = !!choice.requiresGold && run.gold < choice.requiresGold;
            return (
              <button
                key={choice.id}
                className="btn"
                disabled={disabled}
                onClick={() => eventChoose(i)}
                style={{ textAlign: 'left' }}
              >
                {locale === 'en' ? choice.textEn ?? choice.text : choice.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
