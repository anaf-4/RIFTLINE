import { useGameStore } from '../../store/gameStore';
import { useLocale } from '../../i18n/useT';

export default function EventScreen() {
  const game = useGameStore((s) => s.game);
  const eventChoose = useGameStore((s) => s.eventChoose);
  const locale = useLocale();
  const ev = game.activeEvent;
  const run = game.run;
  if (!ev || !run) return null;

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
