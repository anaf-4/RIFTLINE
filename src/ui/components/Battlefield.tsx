import type { ClassId, CombatState } from '../../core/types';
import { useOrientation } from '../orientation';
import StatusBadges from './StatusBadges';
import './Battlefield.css';

const CLASS_LABEL_KO: Record<ClassId, string> = { warden: '파수병', ember: '술사', courier: '밀사', scribe: '각인자' };
const CLASS_LABEL_EN: Record<ClassId, string> = { warden: 'Warden', ember: 'Ember', courier: 'Courier', scribe: 'Scribe' };

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

interface BattlefieldProps {
  combat: CombatState;
  className: ClassId;
  locale: 'ko' | 'en';
  playerShake: boolean;
  enemyShake: string | null;
  targetable: Set<string>;
  onTarget: (uid: string) => void;
}

export default function Battlefield({ combat, className, locale, playerShake, enemyShake, targetable, onTarget }: BattlefieldProps) {
  const orientation = useOrientation();
  const player = combat.player;
  const frontEnemies = combat.enemies.filter((e) => e.line === 'front');
  const backEnemies = combat.enemies.filter((e) => e.line === 'back');
  const classLabel = locale === 'ko' ? CLASS_LABEL_KO[className] : CLASS_LABEL_EN[className];
  const lineLabel = (line: 'front' | 'back') =>
    locale === 'ko' ? (line === 'front' ? '전열' : '후열') : line === 'front' ? 'Front' : 'Back';

  const playerCard = (
    <div className={`rl-enemy rl-player ${playerShake ? 'rl-shake' : ''}`}>
      <div className="rl-enemy-name">
        {classLabel} ({lineLabel(player.line)})
      </div>
      <div className="rl-enemy-sprite rl-player-sprite" style={{ backgroundImage: `url(assets/characters/char_${className}.png)` }} />
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

  const renderEnemy = (e: (typeof combat.enemies)[number]) => (
    <div
      key={e.uid}
      className={`rl-enemy ${e.hp <= 0 ? 'rl-enemy-dead' : ''} ${targetable.has(e.uid) ? 'rl-enemy-targetable' : ''} ${
        enemyShake === e.uid ? 'rl-shake' : ''
      }`}
      onClick={() => targetable.has(e.uid) && onTarget(e.uid)}
    >
      <div className="rl-enemy-name">{locale === 'en' ? e.nameEn ?? e.name : e.name}</div>
      <div className="rl-enemy-sprite" style={{ backgroundImage: `url(${enemySpriteFor(e.defId)})` }} />
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

function enemySpriteFor(defId: string): string {
  const beast = ['rift_hound', 'rift_crawler', 'ember_wisp', 'crystal_stalker'];
  const undead = ['warped_shade', 'void_wraith', 'rift_swarm', 'the_unmade'];
  const golem = ['iron_colossus', 'thorn_construct', 'gravity_horror', 'rift_behemoth', 'broken_sentinel', 'crystal_warden'];
  if (beast.includes(defId)) return 'assets/enemies/enemy_beast.png';
  if (undead.includes(defId)) return 'assets/enemies/enemy_undead.png';
  if (golem.includes(defId)) return 'assets/enemies/enemy_golem.png';
  if (defId.includes('knight') || defId.includes('sovereign') || defId.includes('heart')) return 'assets/boss/boss_riftwalker.png';
  return 'assets/enemies/enemy_humanoid.png';
}
