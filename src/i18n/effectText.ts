import type { CardEffect, ElementId, StatusId } from '../core/types';

export type Locale = 'ko' | 'en';

const STATUS_KO: Record<StatusId, string> = {
  vulnerable: '취약',
  weak: '약화',
  strength: '힘',
  dexterity: '민첩',
  poison: '중독',
  bind: '속박',
  regen: '재생',
  thorns: '가시',
};
const STATUS_EN: Record<StatusId, string> = {
  vulnerable: 'Vulnerable',
  weak: 'Weak',
  strength: 'Strength',
  dexterity: 'Dexterity',
  poison: 'Poison',
  bind: 'Bind',
  regen: 'Regen',
  thorns: 'Thorns',
};

const ELEMENT_KO: Record<ElementId, string> = { fire: '화염', ice: '얼음', lightning: '번개' };
const ELEMENT_EN: Record<ElementId, string> = { fire: 'Fire', ice: 'Ice', lightning: 'Lightning' };

function statusName(id: StatusId, locale: Locale): string {
  return locale === 'ko' ? STATUS_KO[id] ?? id : STATUS_EN[id] ?? id;
}
function elementName(id: ElementId, locale: Locale): string {
  return locale === 'ko' ? ELEMENT_KO[id] ?? id : ELEMENT_EN[id] ?? id;
}

function describeOne(eff: CardEffect, locale: Locale): string {
  const v = eff.value ?? 0;
  const ko = locale === 'ko';

  switch (eff.op) {
    case 'damage': {
      let s = ko ? `${v} 피해를 준다.` : `Deal ${v} damage.`;
      if (eff.condition?.type === 'enemyHpBelow' && eff.onConditionMet?.multiplier) {
        s += ko
          ? ` 적 HP ${eff.condition.percent}% 이하면 두 배.`
          : ` Doubled if the target is below ${eff.condition.percent}% HP.`;
      } else if (eff.condition?.type === 'elementMatch' && eff.onConditionMet?.multiplier) {
        const el = elementName(eff.condition.element as ElementId, locale);
        s += ko ? ` ${el} 마커가 있으면 두 배.` : ` Doubled if the target has a ${el} marker.`;
      } else if (eff.condition?.type === 'comboCount' && eff.onConditionMet?.bonusValue) {
        s += ko
          ? ` 이번 턴 ${eff.condition.count}장 이상 사용했다면 +${eff.onConditionMet.bonusValue}.`
          : ` +${eff.onConditionMet.bonusValue} if you've played ${eff.condition.count}+ cards this turn.`;
      }
      return s;
    }
    case 'damageMulti':
      return ko ? `${v} 피해를 ${eff.times}회 준다.` : `Deal ${v} damage ${eff.times} times.`;
    case 'block':
      return ko ? `방어도 ${v}를 얻는다.` : `Gain ${v} Block.`;
    case 'applyStatus': {
      const name = statusName(eff.status as StatusId, locale);
      if (eff.target === 'enemy_all') {
        return ko ? `모든 적에게 ${name} ${v}을 부여한다.` : `Apply ${v} ${name} to all enemies.`;
      }
      if (eff.target === 'enemy_single') {
        return ko ? `적에게 ${name} ${v}을 부여한다.` : `Apply ${v} ${name} to the enemy.`;
      }
      return ko ? `${name} ${v}을 얻는다.` : `Gain ${v} ${name}.`;
    }
    case 'elementMark': {
      const name = elementName(eff.element as ElementId, locale);
      if (eff.target === 'enemy_all') {
        return ko ? `모든 적에게 ${name} 마커 ${v}를 부여한다.` : `Apply ${v} ${name} marker to all enemies.`;
      }
      return ko ? `${name} 마커 ${v}를 부여한다.` : `Apply ${v} ${name} marker.`;
    }
    case 'draw':
      return ko ? `카드 ${v}장을 뽑는다.` : `Draw ${v} card${v === 1 ? '' : 's'}.`;
    case 'energy':
      return ko ? `에너지 ${v}를 얻는다.` : `Gain ${v} Energy.`;
    case 'move': {
      if (eff.to === 'front') return ko ? '전열로 이동한다.' : 'Move to the front line.';
      if (eff.to === 'back') return ko ? '후열로 이동한다.' : 'Move to the back line.';
      return ko ? '라인을 전환한다.' : 'Switch lines.';
    }
    case 'pull':
      return ko ? '적 1체를 전열로 끌어온다.' : 'Pull one enemy to the front line.';
    case 'push':
      return ko ? '적 1체를 후열로 밀어낸다.' : 'Push one enemy to the back line.';
    case 'heal':
      return v < 0
        ? ko
          ? `체력 ${Math.abs(v)}를 잃는다.`
          : `Lose ${Math.abs(v)} HP.`
        : ko
          ? `체력 ${v}를 회복한다.`
          : `Restore ${v} HP.`;
    case 'exhaust':
      return '';
    case 'modifyStat': {
      switch (eff.stat) {
        case 'blockCarryPercent':
          return ko
            ? `초과 방어도 유지율이 ${Math.round(v * 100)}%가 된다.`
            : `Block carryover becomes ${Math.round(v * 100)}%.`;
        case 'movesPerTurn':
          return ko ? `턴당 이동 횟수가 ${v} 증가한다.` : `+${v} move${v === 1 ? '' : 's'} per turn.`;
        case 'energyMax':
          return ko ? `최대 에너지가 ${v} 증가한다.` : `+${v} max Energy.`;
        case 'maxHp':
          return ko ? `최대 체력이 ${v} 증가한다.` : `+${v} max HP.`;
        case 'potionSlots':
          return ko ? `포션 슬롯이 ${v} 증가한다.` : `+${v} potion slot${v === 1 ? '' : 's'}.`;
        default:
          return '';
      }
    }
    default:
      return '';
  }
}

export function describeCardEffects(
  effects: CardEffect[],
  locale: Locale,
  opts?: { trigger?: 'onPlay' | 'endOfTurn'; exhaustAfterUse?: boolean }
): string {
  const parts = effects.map((e) => describeOne(e, locale)).filter(Boolean);
  let text = parts.join(' ');
  if (opts?.trigger === 'endOfTurn') {
    text = locale === 'ko' ? `매 턴 종료 시 ${text}` : `At the end of each turn, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  if (opts?.exhaustAfterUse) {
    text += locale === 'ko' ? ' 소멸.' : ' Exhaust.';
  }
  return text;
}
