import { useEffect, useRef, useState } from 'react';
import type { ClassId, CombatState, EnemyInstance, Line } from '../../core/types';
import { useOrientation } from '../orientation';
import StatusBadges from './StatusBadges';
import './Battlefield.css';

const CLASS_LABEL_KO: Record<ClassId, string> = { warden: '파수병', ember: '술사', courier: '밀사', scribe: '각인자' };
const CLASS_LABEL_EN: Record<ClassId, string> = { warden: 'Warden', ember: 'Ember', courier: 'Courier', scribe: 'Scribe' };

type Pose = 'idle' | 'walk' | 'attack' | 'hurt';

function intentIcon(intent: CombatState['enemies'][number]['currentIntent']): string {
  if (!intent) return '?';
  switch (intent.type) {
    case 'attack':
      return '⚔';
    case 'block':
      return '🛡';
    case 'buff':
      return '↑';
    case 'debuff':
      return '↓';
    case 'move':
      return '👣';
    default:
      return '?';
  }
}

function intentValue(intent: CombatState['enemies'][number]['currentIntent']): string {
  if (!intent) return '';
  if (intent.type === 'attack') return `${intent.value}${intent.times && intent.times > 1 ? ` ×${intent.times}` : ''}`;
  if (intent.type === 'buff' || intent.type === 'debuff') return `${intent.value ?? ''}`;
  return '';
}

function enemyCategoryFor(defId: string): 'beast' | 'undead' | 'golem' | 'humanoid' | 'boss' {
  const beast = ['rift_hound', 'rift_crawler', 'ember_wisp', 'crystal_stalker'];
  const undead = ['warped_shade', 'void_wraith', 'rift_swarm', 'the_unmade'];
  const golem = ['iron_colossus', 'thorn_construct', 'gravity_horror', 'rift_behemoth', 'broken_sentinel', 'crystal_warden'];
  if (beast.includes(defId)) return 'beast';
  if (undead.includes(defId)) return 'undead';
  if (golem.includes(defId)) return 'golem';
  if (defId.includes('knight') || defId.includes('sovereign') || defId.includes('heart')) return 'boss';
  return 'humanoid';
}

function enemySpriteUrl(defId: string, pose: Pose): string {
  const category = enemyCategoryFor(defId);
  if (category === 'boss') return 'assets/boss/boss_riftwalker.png'; // 보스는 포즈별 프레임이 없어 정지 이미지 하나만 사용
  return `assets/enemies/enemy_${category}_${pose}.png`;
}

function playerSpriteUrl(className: ClassId, pose: Pose): string {
  return `assets/characters/${className}_${pose}.png`;
}

/** 특정 시점에 포즈를 잠깐 바꿨다가 자동으로 원래대로 되돌리는 훅 */
function usePoseTimers() {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);
  return timers.current;
}

interface BattlefieldProps {
  combat: CombatState;
  className: ClassId;
  locale: 'ko' | 'en';
  playerShake: boolean;
  enemyShake: string | null;
  attackSeq: number;
  targetable: Set<string>;
  onTarget: (uid: string) => void;
}

export default function Battlefield({
  combat,
  className,
  locale,
  playerShake,
  enemyShake,
  attackSeq,
  targetable,
  onTarget,
}: BattlefieldProps) {
  const orientation = useOrientation();
  const player = combat.player;
  const frontEnemies = combat.enemies.filter((e) => e.line === 'front');
  const backEnemies = combat.enemies.filter((e) => e.line === 'back');
  const classLabel = locale === 'ko' ? CLASS_LABEL_KO[className] : CLASS_LABEL_EN[className];
  const lineLabel = (line: Line) => (locale === 'ko' ? (line === 'front' ? '전열' : '후열') : line === 'front' ? 'Front' : 'Back');

  const [playerWalkFlash, setPlayerWalkFlash] = useState(false);
  const [playerAttackFlash, setPlayerAttackFlash] = useState(false);
  const [enemyWalkFlash, setEnemyWalkFlash] = useState<string | null>(null);
  const [enemyAttackFlash, setEnemyAttackFlash] = useState<Set<string>>(new Set());

  const timers = usePoseTimers();
  const prevPlayerLine = useRef(player.line);
  const prevEnemyLines = useRef<Map<string, Line>>(new Map());
  const prevTurn = useRef(combat.turn);
  const prevAttackSeq = useRef(attackSeq);

  // 플레이어 라인 이동 → 걷기 포즈 잠깐
  useEffect(() => {
    if (player.line !== prevPlayerLine.current) {
      prevPlayerLine.current = player.line;
      setPlayerWalkFlash(true);
      clearTimeout(timers.get('pwalk'));
      timers.set(
        'pwalk',
        setTimeout(() => setPlayerWalkFlash(false), 260)
      );
    }
  }, [player.line, timers]);

  // 카드 사용 → 공격 포즈 잠깐
  useEffect(() => {
    if (attackSeq !== prevAttackSeq.current) {
      prevAttackSeq.current = attackSeq;
      setPlayerAttackFlash(true);
      clearTimeout(timers.get('pattack'));
      timers.set(
        'pattack',
        setTimeout(() => setPlayerAttackFlash(false), 320)
      );
    }
  }, [attackSeq, timers]);

  // 적 턴이 지나갈 때마다(턴 카운터 증가) 전열 생존 적에게 공격 포즈를 잠깐 부여
  useEffect(() => {
    if (combat.turn !== prevTurn.current) {
      prevTurn.current = combat.turn;
      const attackers = combat.enemies.filter((e) => e.hp > 0 && e.line === 'front').map((e) => e.uid);
      setEnemyAttackFlash(new Set(attackers));
      clearTimeout(timers.get('eattack'));
      timers.set(
        'eattack',
        setTimeout(() => setEnemyAttackFlash(new Set()), 320)
      );
    }
  }, [combat.turn, combat.enemies, timers]);

  // 적 라인 이동 감지 → 걷기 포즈 잠깐
  useEffect(() => {
    for (const e of combat.enemies) {
      const prev = prevEnemyLines.current.get(e.uid);
      if (prev !== undefined && prev !== e.line) {
        setEnemyWalkFlash(e.uid);
        clearTimeout(timers.get('ewalk_' + e.uid));
        timers.set(
          'ewalk_' + e.uid,
          setTimeout(() => setEnemyWalkFlash((cur) => (cur === e.uid ? null : cur)), 260)
        );
      }
      prevEnemyLines.current.set(e.uid, e.line);
    }
  }, [combat.enemies, timers]);

  function playerPose(): Pose {
    if (playerShake) return 'hurt';
    if (playerAttackFlash) return 'attack';
    if (playerWalkFlash) return 'walk';
    return 'idle';
  }

  function enemyPose(e: EnemyInstance): Pose {
    if (enemyShake === e.uid) return 'hurt';
    if (enemyAttackFlash.has(e.uid)) return 'attack';
    if (enemyWalkFlash === e.uid) return 'walk';
    return 'idle';
  }

  const playerCard = (
    <div className={`rl-enemy rl-player ${playerShake ? 'rl-shake' : ''}`}>
      <div className="rl-enemy-name">
        {classLabel} ({lineLabel(player.line)})
      </div>
      <div
        className="rl-enemy-sprite rl-player-sprite"
        style={{ backgroundImage: `url(${playerSpriteUrl(className, playerPose())})` }}
      />
      <div className="rl-hpbar">
        <div
          className="rl-hpbar-fill"
          style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%`, background: 'var(--hp)' }}
        />
        <span className="rl-hpbar-text tabular">
          {Math.max(0, player.hp)}/{player.maxHp}
        </span>
      </div>
      {player.block > 0 && <div className="rl-block tabular">🛡 {player.block}</div>}
      <StatusBadges statuses={player.statuses} />
    </div>
  );

  const renderEnemy = (e: EnemyInstance) => (
    <div
      key={e.uid}
      className={`rl-enemy ${e.hp <= 0 ? 'rl-enemy-dead' : ''} ${targetable.has(e.uid) ? 'rl-enemy-targetable' : ''} ${
        enemyShake === e.uid ? 'rl-shake' : ''
      }`}
      onClick={() => targetable.has(e.uid) && onTarget(e.uid)}
    >
      <div className="rl-enemy-name">{e.name}</div>
      <div className="rl-enemy-sprite" style={{ backgroundImage: `url(${enemySpriteUrl(e.defId, enemyPose(e))})` }} />
      <div className="rl-hpbar">
        <div className="rl-hpbar-fill" style={{ width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` }} />
        <span className="rl-hpbar-text tabular">
          {Math.max(0, e.hp)}/{e.maxHp}
        </span>
      </div>
      {e.block > 0 && <div className="rl-block tabular">🛡 {e.block}</div>}
      <StatusBadges statuses={e.statuses} />
      {(e.elementMarks.fire || e.elementMarks.ice || e.elementMarks.lightning) && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 2 }}>
          {e.elementMarks.fire ? (
            <span style={{ fontSize: 11, color: '#e0603c' }} className="tabular">
              🔥{e.elementMarks.fire}
            </span>
          ) : null}
          {e.elementMarks.ice ? (
            <span style={{ fontSize: 11, color: '#6cc4e0' }} className="tabular">
              ❄{e.elementMarks.ice}
            </span>
          ) : null}
          {e.elementMarks.lightning ? (
            <span style={{ fontSize: 11, color: '#e0d43c' }} className="tabular">
              ⚡{e.elementMarks.lightning}
            </span>
          ) : null}
        </div>
      )}
      {e.hp > 0 && (
        <div className="rl-intent">
          <span>{intentIcon(e.currentIntent)}</span>
          <span className="tabular">{intentValue(e.currentIntent)}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`rl-battlefield-grid ${orientation === 'portrait' ? 'portrait' : ''}`}>
      <div className="rl-slot rl-slot-pback">{player.line === 'back' && playerCard}</div>
      <div className="rl-slot rl-slot-pfront">{player.line === 'front' && playerCard}</div>
      <div className="rl-rift-divider" />
      <div className="rl-slot rl-slot-efront">{frontEnemies.map(renderEnemy)}</div>
      <div className="rl-slot rl-slot-eback">{backEnemies.map(renderEnemy)}</div>
    </div>
  );
}
