import { useGameStore } from '../../store/gameStore';
import { reachableNodes } from '../../core/run';
import type { MapNode, NodeType } from '../../core/types';
import { useT } from '../../i18n/useT';

const NODE_ICON: Record<NodeType, string> = {
  combat: '⚔',
  elite: '☠',
  event: '❔',
  rest: '🔥',
  shop: '🛒',
  boss: '👑',
};

const NODE_COLOR: Record<NodeType, string> = {
  combat: 'var(--card-attack)',
  elite: '#a8425a',
  event: 'var(--card-power)',
  rest: 'var(--accent)',
  shop: 'var(--card-skill)',
  boss: '#e0304a',
};

const ROWS = 10;
const WIDTH = 5;
const PAD_X = 90;
const ROW_SPACING = (1280 - PAD_X * 2) / ROWS;
const COL_SPACING = (460 - 40) / (WIDTH - 1);

function nodePos(n: MapNode) {
  if (n.type === 'boss') return { x: PAD_X + ROWS * ROW_SPACING, y: 40 + ((WIDTH - 1) * COL_SPACING) / 2 };
  return { x: PAD_X + n.row * ROW_SPACING, y: 40 + n.col * COL_SPACING };
}

export default function MapScreen() {
  const run = useGameStore((s) => s.game.run);
  const selectMapNode = useGameStore((s) => s.selectMapNode);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const t = useT();

  if (!run) return null;
  const reachable = new Set(reachableNodes(run).map((n) => n.id));
  const bgAct = Math.min(4, run.act);

  return (
    <div className="game-viewport" style={{ backgroundImage: `linear-gradient(rgba(10,11,15,0.82), rgba(10,11,15,0.92)), url(assets/bg/act${bgAct}.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', fontSize: 13, color: 'var(--text-sub)' }}>
        <div>
          {run.act}막 · {t('gold')} {run.gold} · HP {run.hp}/{run.maxHp}
        </div>
        <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} onClick={backToTitle}>
          {t('give_up')}
        </button>
      </div>

      <div style={{ position: 'relative', width: 1280, height: 620, overflowX: 'auto' }}>
        <svg width={1280} height={620} style={{ position: 'absolute', top: 0, left: 0 }}>
          {run.mapNodes.map((n) =>
            n.connections.map((toId) => {
              const to = run.mapNodes.find((m) => m.id === toId);
              if (!to) return null;
              const a = nodePos(n);
              const b = nodePos(to);
              const active = run.completedNodeIds.includes(n.id);
              return (
                <line
                  key={`${n.id}-${toId}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={active ? 3 : 1.5}
                  opacity={active ? 0.9 : 0.5}
                />
              );
            })
          )}
        </svg>

        {run.mapNodes.map((n) => {
          const pos = nodePos(n);
          const isReachable = reachable.has(n.id);
          const isCurrent = run.currentNodeId === n.id;
          const isDone = run.completedNodeIds.includes(n.id);
          return (
            <div
              key={n.id}
              onClick={() => isReachable && selectMapNode(n.id)}
              title={n.type}
              style={{
                position: 'absolute',
                left: pos.x - 22,
                top: pos.y - 22,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: NODE_COLOR[n.type],
                border: isCurrent ? '3px solid white' : isReachable ? '3px solid var(--accent)' : '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                cursor: isReachable ? 'pointer' : 'default',
                opacity: isDone ? 0.4 : isReachable ? 1 : 0.7,
                boxShadow: isReachable ? '0 0 12px var(--accent)' : 'none',
                transition: 'transform 0.1s',
              }}
            >
              {NODE_ICON[n.type]}
            </div>
          );
        })}
      </div>

      <div className="title-sub" style={{ textAlign: 'center', fontSize: 12 }}>
        {t('map_legend')}
      </div>
    </div>
  );
}
