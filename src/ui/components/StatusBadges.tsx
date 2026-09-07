import type { StatusMap } from '../../core/types';
import { statusIcon, statusLabel } from './statusIcons';

export default function StatusBadges({ statuses }: { statuses: StatusMap }) {
  const entries = Object.entries(statuses).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
      {entries.map(([id, v]) => (
        <div
          key={id}
          title={statusLabel[id] ?? id}
          style={{
            fontSize: 11,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 4,
            padding: '1px 4px',
            display: 'flex',
            gap: 2,
          }}
        >
          <span>{statusIcon[id] ?? '?'}</span>
          <span className="tabular">{v}</span>
        </div>
      ))}
    </div>
  );
}
