import InfoModal from './InfoModal';
import { getEnemyDef } from '../../data/enemies';
import { STATUS_INFO } from '../../i18n/glossary';
import { statusIcon, statusLabel } from './statusIcons';
import type { EnemyInstance, IntentDef } from '../../core/types';
import type { Locale } from '../../i18n/strings';

function intentIcon(intent: IntentDef): string {
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

function intentDesc(intent: IntentDef, locale: Locale): string {
  const times = intent.times && intent.times > 1 ? ` ×${intent.times}` : '';
  switch (intent.type) {
    case 'attack': {
      const rangedTag = intent.ranged ? (locale === 'ko' ? ' (원거리)' : ' (ranged)') : '';
      return locale === 'ko' ? `피해 ${intent.value}${times}${rangedTag}` : `Deal ${intent.value}${times} damage${rangedTag}`;
    }
    case 'block':
      return locale === 'ko' ? `방어막 ${intent.value}` : `Gain ${intent.value} Block`;
    case 'buff':
      return locale === 'ko'
        ? `자신에게 ${statusLabel[intent.status ?? ''] ?? intent.status} ${intent.value}`
        : `Gains ${intent.value} ${intent.status}`;
    case 'debuff':
      return locale === 'ko'
        ? `플레이어에게 ${statusLabel[intent.status ?? ''] ?? intent.status} ${intent.value}`
        : `Applies ${intent.value} ${intent.status} to you`;
    case 'move':
      return locale === 'ko' ? '전열/후열 전환' : 'Switches line';
    default:
      return '?';
  }
}

export default function EnemyInfoModal({ enemy, locale, onClose }: { enemy: EnemyInstance; locale: Locale; onClose: () => void }) {
  const def = getEnemyDef(enemy.defId);
  const totalWeight = def.intents.reduce((s, i) => s + i.weight, 0);
  const name = locale === 'ko' ? def.name : def.nameEn ?? def.name;
  const activeStatuses = Object.entries(enemy.statuses).filter(([, v]) => v);
  const marks = Object.entries(enemy.elementMarks).filter(([, v]) => (v ?? 0) > 0);

  return (
    <InfoModal title={name} onClose={onClose}>
      <div className="rl-info-section">
        <div className="rl-info-section-title">HP</div>
        <div>
          {Math.max(0, enemy.hp)}/{enemy.maxHp}
          {enemy.block > 0 ? ` · 🛡 ${enemy.block}` : ''}
        </div>
      </div>

      {activeStatuses.length > 0 && (
        <div className="rl-info-section">
          <div className="rl-info-section-title">{locale === 'ko' ? '현재 상태' : 'Active Statuses'}</div>
          {activeStatuses.map(([id, v]) => (
            <div className="rl-info-row" key={id}>
              <span className="rl-info-row-icon">{statusIcon[id] ?? '?'}</span>
              <span>
                {v} — {STATUS_INFO[id as keyof typeof STATUS_INFO]?.[locale] ?? id}
              </span>
            </div>
          ))}
        </div>
      )}

      {marks.length > 0 && (
        <div className="rl-info-section">
          <div className="rl-info-section-title">{locale === 'ko' ? '속성 마커' : 'Element Marks'}</div>
          {marks.map(([el, v]) => (
            <div key={el}>
              {el} {v}
            </div>
          ))}
        </div>
      )}

      <div className="rl-info-section">
        <div className="rl-info-section-title">{locale === 'ko' ? '가능한 행동' : 'Possible Actions'}</div>
        {def.intents.map((intent, i) => (
          <div className="rl-info-row" key={i}>
            <span className="rl-info-row-icon">{intentIcon(intent)}</span>
            <span>
              {intentDesc(intent, locale)} ({Math.round((intent.weight / totalWeight) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </InfoModal>
  );
}
