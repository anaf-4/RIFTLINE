import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import Hand from '../components/Hand';
import Battlefield from '../components/Battlefield';
import PlayZone, { type FlyingCard } from '../components/PlayZone';
import TutorialOverlay from '../components/TutorialOverlay';
import { useT, useLocale } from '../../i18n/useT';
import '../components/Battlefield.css';
import './CombatScreen.css';

export default function CombatScreen() {
  const game = useGameStore((s) => s.game);
  const ui = useGameStore((s) => s.ui);
  const meta = useGameStore((s) => s.meta);
  const selectCard = useGameStore((s) => s.selectCard);
  const selectTarget = useGameStore((s) => s.selectTarget);
  const cancelTargeting = useGameStore((s) => s.cancelTargeting);
  const doMove = useGameStore((s) => s.doMove);
  const endTurn = useGameStore((s) => s.endTurn);
  const proceedFromResult = useGameStore((s) => s.proceedFromResult);
  const usePotionInCombat = useGameStore((s) => s.usePotionInCombat);
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const t = useT();
  const locale = useLocale();

  const combat = game.run?.combat;
  const viewportRef = useRef<HTMLDivElement>(null);
  const armedRect = useRef<Map<string, DOMRect>>(new Map());
  const [flying, setFlying] = useState<FlyingCard[]>([]);
  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState<string | null>(null);
  const prevPlayerHp = useRef<number | null>(null);
  const prevEnemyHp = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!combat) return;
    if (prevPlayerHp.current !== null && combat.player.hp < prevPlayerHp.current) {
      setPlayerShake(true);
      const t = setTimeout(() => setPlayerShake(false), 200);
      return () => clearTimeout(t);
    }
    prevPlayerHp.current = combat.player.hp;
  }, [combat?.player.hp]);

  useEffect(() => {
    if (!combat) return;
    for (const e of combat.enemies) {
      const prev = prevEnemyHp.current.get(e.uid);
      if (prev !== undefined && e.hp < prev) {
        setEnemyShake(e.uid);
        setTimeout(() => setEnemyShake(null), 200);
      }
      prevEnemyHp.current.set(e.uid, e.hp);
    }
  }, [combat?.enemies]);

  useEffect(() => {
    if (!ui.lastPlayed) return;
    const rect = armedRect.current.get(ui.lastPlayed.cardUid);
    const vpEl = viewportRef.current;
    if (!rect || !vpEl) return;
    armedRect.current.delete(ui.lastPlayed.cardUid);
    const vp = vpEl.getBoundingClientRect();
    // ViewportScaler가 transform: scale()을 적용하므로, offsetWidth(스케일 전 논리 너비) 대비
    // getBoundingClientRect().width(스케일 후 실제 너비) 비율로 배율을 역산한다.
    const scale = vp.width / vpEl.offsetWidth;
    const logicalRect = new DOMRect(
      (rect.left - vp.left) / scale,
      (rect.top - vp.top) / scale,
      rect.width / scale,
      rect.height / scale
    );
    const key = `${ui.lastPlayed.seq}`;
    setFlying((f) => [
      ...f,
      { key, defId: ui.lastPlayed!.defId, upgraded: ui.lastPlayed!.upgraded, fromRect: logicalRect, exhaust: ui.lastPlayed!.exhaust },
    ]);
  }, [ui.lastPlayed]);

  if (!combat || !game.run) return null;

  const p = game.run;
  const isTargeting = !!ui.pendingCardUid;
  const targetable = new Set(isTargeting ? ui.pendingTargets : []);
  const outcome = combat.turnPhase === 'won' || combat.turnPhase === 'lost';
  const bgAct = Math.min(4, p.act);

  return (
    <div
      className="game-viewport rl-combat-layout"
      ref={viewportRef}
      style={{
        backgroundImage: `linear-gradient(rgba(10,11,15,0.88), rgba(10,11,15,0.94)), url(assets/bg/act${bgAct}.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="rl-combat-header">
        <div>
          {p.act}막 · {t('ascension')} {p.ascension} · {p.seed}
        </div>
        <div className="rl-header-stats tabular">
          <span>{t('deck')} {combat.drawPile.length}</span>
          <span>{t('discard')} {combat.discardPile.length}</span>
          <span>{t('exhaust')} {combat.exhaustPile.length}</span>
          <span>{t('gold')} {p.gold}</span>
        </div>
      </div>

      <div className="rl-combat-battlefield-zone" onClick={() => isTargeting && cancelTargeting()}>
        <Battlefield
          combat={combat}
          className={p.className}
          locale={locale}
          playerShake={playerShake}
          enemyShake={enemyShake}
          attackSeq={ui.lastPlayed?.seq ?? 0}
          targetable={targetable}
          onTarget={(uid) => selectTarget(uid)}
        />
        {isTargeting && <div className="rl-target-hint">{t('choose_target')}</div>}
      </div>

      <div className="rl-combat-footer">
        <div className="rl-actionbar-row">
          <div className="rl-actionbar-left">
            <div className="rl-energy-badge tabular">
              {combat.player.energy}/{combat.player.energyMax}
            </div>
            <button
              className="btn"
              disabled={
                combat.turnPhase !== 'player' ||
                combat.player.movesUsed >= combat.player.movesPerTurn ||
                combat.player.energy < combat.moveEnergyCost
              }
              onClick={doMove}
            >
              {t('move')} ({combat.player.movesPerTurn - combat.player.movesUsed}){combat.moveEnergyCost > 0 ? ` [${combat.moveEnergyCost}]` : ''}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {p.potions.map((potionId, i) => (
                <button
                  key={i}
                  className="btn rl-potion-btn"
                  style={{ opacity: potionId ? 1 : 0.3 }}
                  disabled={!potionId || combat.turnPhase !== 'player'}
                  title={potionId ?? undefined}
                  onClick={() => usePotionInCombat(i)}
                >
                  <span className="rl-icon-potion" style={{ backgroundImage: 'url(assets/icons/icon_potion.png)' }} />
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-accent" disabled={combat.turnPhase !== 'player'} onClick={endTurn}>
            {t('end_turn')}
          </button>
        </div>

        <div className="rl-hand-dock">
          <Hand
            hand={combat.hand}
            combat={combat}
            pendingCardUid={ui.pendingCardUid}
            onCardClick={(uid, rect) => {
              armedRect.current.set(uid, rect);
              selectCard(uid);
            }}
          />
        </div>
      </div>

      <PlayZone cards={flying} onDone={(key) => setFlying((f) => f.filter((c) => c.key !== key))} />

      {!meta.tutorialSeen && !outcome && <TutorialOverlay onDone={markTutorialSeen} />}

      {outcome && (
        <div className="rl-outcome-overlay">
          <div style={{ fontSize: 32, fontWeight: 800, color: combat.turnPhase === 'won' ? 'var(--accent)' : 'var(--hp)' }}>
            {combat.turnPhase === 'won' ? t('victory_combat') : t('defeat')}
          </div>
          <button className="btn btn-accent" onClick={proceedFromResult}>
            {t('proceed')}
          </button>
        </div>
      )}
    </div>
  );
}
