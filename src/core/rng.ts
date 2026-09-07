// 시드 기반 의사난수. Math.random()을 직접 쓰지 않는다 (재현 가능성 확보).

export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}

// mulberry32
export function createRng(seed: number): Rng {
  let a = seed >>> 0;

  function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  function pick<T>(arr: T[]): T {
    return arr[int(0, arr.length - 1)];
  }

  function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  return { next, int, pick, shuffle };
}

export function randomSeed(): number {
  // 초기 시드 생성에만 사용 (게임플레이 로직에는 쓰이지 않음)
  return Date.now() ^ (Math.random() * 0xffffffff);
}
