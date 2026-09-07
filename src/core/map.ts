import type { MapNode, NodeType } from './types';
import type { Rng } from './rng';

const WIDTH = 5;
const ROWS_PER_ACT = 10; // 보스 제외. 문서 기준 16층을 세션 규모에 맞춰 축소.
const PATH_COUNT = 6;

function pickType(rng: Rng, row: number, prevRowTypes: Map<number, NodeType>): NodeType {
  if (row === 0) return 'combat';
  const roll = rng.next() * 100;
  let type: NodeType;
  if (roll < 45) type = 'combat';
  else if (roll < 67) type = 'event';
  else if (roll < 83) type = 'elite';
  else if (roll < 95) type = 'rest';
  else type = 'shop';

  // 연속된 엘리트/휴식 방지
  const prev = prevRowTypes.get(row - 1);
  if ((type === 'elite' && prev === 'elite') || (type === 'rest' && prev === 'rest')) {
    return 'combat';
  }
  // 초반 2줄은 엘리트를 배치하지 않는다 (휴식 없이 바로 강한 전투를 만나는 것을 방지)
  if (row <= 2 && type === 'elite') return 'combat';
  return type;
}

export function generateActMap(act: 1 | 2 | 3 | 4, rng: Rng): MapNode[] {
  const nodeKey = (row: number, col: number) => `a${act}_r${row}_c${col}`;
  const nodesByPos = new Map<string, MapNode>();

  function ensureNode(row: number, col: number): MapNode {
    const key = nodeKey(row, col);
    let node = nodesByPos.get(key);
    if (!node) {
      node = { id: key, act, row, col, type: 'combat', connections: [] };
      nodesByPos.set(key, node);
    }
    return node;
  }

  // 여러 경로를 랜덤 워크로 생성해 겹치게 하여 분기형 맵을 만든다
  for (let p = 0; p < PATH_COUNT; p++) {
    let col = rng.int(0, WIDTH - 1);
    ensureNode(0, col);
    for (let row = 0; row < ROWS_PER_ACT - 1; row++) {
      const from = ensureNode(row, col);
      const delta = rng.int(-1, 1);
      const nextCol = Math.min(WIDTH - 1, Math.max(0, col + delta));
      const to = ensureNode(row + 1, nextCol);
      if (!from.connections.includes(to.id)) from.connections.push(to.id);
      col = nextCol;
    }
  }

  // 보스 노드: 마지막 행 전체가 보스로 수렴
  const bossNode: MapNode = { id: `a${act}_boss`, act, row: ROWS_PER_ACT, col: 0, type: 'boss', connections: [] };
  nodesByPos.set(bossNode.id, bossNode);
  for (const node of nodesByPos.values()) {
    if (node.row === ROWS_PER_ACT - 1 && node.type !== 'boss') {
      if (!node.connections.includes(bossNode.id)) node.connections.push(bossNode.id);
    }
  }

  // 중반에 최소 한 번의 휴식을 보장한다 (운 나쁘면 첫 휴식을 보스 직전까지 못 만나는 문제 방지)
  const guaranteedRestRow = Math.floor(ROWS_PER_ACT / 2);

  // 타입 배정: 행 전체를 보고 이전 행 타입을 참고해 연속 억제
  const prevRowTypes = new Map<number, NodeType>();
  for (let row = 0; row < ROWS_PER_ACT; row++) {
    const rowNodes = [...nodesByPos.values()].filter((n) => n.row === row);
    if (rowNodes.length === 0) continue;
    let rowType: NodeType;
    if (row === ROWS_PER_ACT - 1) {
      rowType = 'rest'; // 보스 직전은 항상 휴식 (기획서 9장: "휴식 → 보스")
    } else if (row === guaranteedRestRow) {
      rowType = 'rest';
    } else {
      rowType = pickType(rng, row, prevRowTypes);
    }
    for (const n of rowNodes) n.type = rowType;
    prevRowTypes.set(row, rowType);
  }

  return [...nodesByPos.values()];
}

export function reachableNodeIds(nodes: MapNode[], currentNodeId: string | null): Set<string> {
  if (currentNodeId === null) {
    const minRow = Math.min(...nodes.map((n) => n.row));
    return new Set(nodes.filter((n) => n.row === minRow).map((n) => n.id));
  }
  const current = nodes.find((n) => n.id === currentNodeId);
  if (!current) return new Set();
  return new Set(current.connections);
}
