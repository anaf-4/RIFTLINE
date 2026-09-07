// AES-256-GCM 기반 세이브 암호화. 기획서 19장 참조.
// 목표: 메모장 수정, 세이브 되돌리기(scumming), 해금 위조를 막는다.
// 목표로 하지 않는 것: 리버스 엔지니어링, 메모리 에디터 방어.

const MAGIC = 'RFTL';
const VERSION = 1;
const ITERATIONS = 120_000;
// 빌드 타임 상수. 번들에서 추출 가능함을 인지하고 있다 (문서 19.4 참조).
const APP_SECRET = 'riftline-teamcraft-v0.1-static-secret-key-32b';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSave(data: unknown, salt: Uint8Array): Promise<string> {
  const key = await deriveKey(salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext)
  );

  const magicBytes = new TextEncoder().encode(MAGIC);
  const out = new Uint8Array(4 + 2 + 12 + cipher.length);
  out.set(magicBytes, 0);
  new DataView(out.buffer).setUint16(4, VERSION);
  out.set(iv, 6);
  out.set(cipher, 18);
  return toBase64(out);
}

export async function decryptSave<T>(b64: string, salt: Uint8Array): Promise<T | null> {
  try {
    const raw = fromBase64(b64);
    const magic = new TextDecoder().decode(raw.slice(0, 4));
    if (magic !== MAGIC) return null;

    const ver = new DataView(raw.buffer).getUint16(4);
    const iv = raw.slice(6, 18);
    const cipher = raw.slice(18);

    const key = await deriveKey(salt);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, cipher as BufferSource);
    const parsed = JSON.parse(new TextDecoder().decode(plain));
    if (ver !== VERSION) return parsed as T; // 향후 마이그레이션 지점
    return parsed as T;
  } catch {
    return null; // 변조 또는 손상
  }
}

export function getOrCreateSalt(existing: string | null): Uint8Array {
  if (existing) return fromBase64(existing);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return salt;
}

export function saltToStorable(salt: Uint8Array): string {
  return toBase64(salt);
}

// ---------- meta.sav ----------

export interface MetaSave {
  runCounter: number;
  unlockedClasses: string[];
  ascensionByClass: Record<string, number>;
  winsByClass: Record<string, number>;
  totalRuns: number;
  totalWins: number;
  achievements: string[];
  act4Unlocked: boolean;
  tutorialSeen: boolean;
  settings: { animationsEnabled: boolean; language: 'ko' | 'en' };
}

export function defaultMeta(): MetaSave {
  return {
    runCounter: 0,
    unlockedClasses: ['warden', 'ember', 'courier'],
    ascensionByClass: { warden: 0, ember: 0, courier: 0, scribe: 0 },
    winsByClass: { warden: 0, ember: 0, courier: 0, scribe: 0 },
    totalRuns: 0,
    totalWins: 0,
    achievements: [],
    act4Unlocked: false,
    tutorialSeen: false,
    settings: { animationsEnabled: true, language: 'ko' },
  };
}

// 단조 증가 필드는 감소할 수 없다 (위조 방지)
export function mergeMetaSafely(current: MetaSave, incoming: MetaSave): MetaSave {
  const winsByClass: Record<string, number> = { ...incoming.winsByClass };
  for (const k of Object.keys(current.winsByClass ?? {})) {
    winsByClass[k] = Math.max(current.winsByClass[k] ?? 0, winsByClass[k] ?? 0);
  }
  const achievements = Array.from(new Set([...(current.achievements ?? []), ...(incoming.achievements ?? [])]));
  return {
    ...incoming,
    runCounter: Math.max(current.runCounter, incoming.runCounter),
    totalRuns: Math.max(current.totalRuns, incoming.totalRuns),
    totalWins: Math.max(current.totalWins, incoming.totalWins),
    winsByClass,
    achievements,
    act4Unlocked: current.act4Unlocked || incoming.act4Unlocked,
    unlockedClasses: Array.from(new Set([...(current.unlockedClasses ?? []), ...(incoming.unlockedClasses ?? [])])),
  };
}
