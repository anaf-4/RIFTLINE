import { useGameStore } from '../../store/gameStore';
import { useT } from '../../i18n/useT';

export default function GameOverScreen() {
  const run = useGameStore((s) => s.game.run);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const t = useT();

  return (
    <div className="game-viewport">
      <div className="centered-screen">
        <div className="title-logo" style={{ color: 'var(--hp)', fontSize: 48 }}>
          {t('defeat')}
        </div>
        <div className="title-sub">{t('defeat_msg', run?.act ?? 1)}</div>
        <button className="btn btn-accent" onClick={backToTitle}>
          {t('to_title')}
        </button>
      </div>
    </div>
  );
}
