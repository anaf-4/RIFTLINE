import { platform } from '../platform';
import { encryptSave, decryptSave, getOrCreateSalt, saltToStorable, defaultMeta, mergeMetaSafely, type MetaSave } from './save';
import type { RunState } from './types';

const KEY_SALT = 'riftline.salt';
const KEY_META = 'riftline.meta';
const KEY_RUN = 'riftline.run';

let saltCache: Uint8Array | null = null;

async function getSalt(): Promise<Uint8Array> {
  if (saltCache) return saltCache;
  const existing = await platform.load(KEY_SALT);
  const salt = getOrCreateSalt(existing);
  if (!existing) await platform.save(KEY_SALT, saltToStorable(salt));
  saltCache = salt;
  return salt;
}

export async function loadMeta(): Promise<MetaSave> {
  const salt = await getSalt();
  const raw = await platform.load(KEY_META);
  if (!raw) return defaultMeta();
  const parsed = await decryptSave<MetaSave>(raw, salt);
  if (!parsed) {
    const bak = await platform.load(KEY_META + '.bak');
    if (bak) {
      const parsedBak = await decryptSave<MetaSave>(bak, salt);
      if (parsedBak) return parsedBak;
    }
    return defaultMeta();
  }
  return parsed;
}

export async function saveMeta(meta: MetaSave): Promise<void> {
  try {
    const salt = await getSalt();
    const current = await loadMeta();
    const safe = mergeMetaSafely(current, meta);
    const encrypted = await encryptSave(safe, salt);
    await platform.save(KEY_META, encrypted);
    await platform.save(KEY_META + '.bak', encrypted);
  } catch {
    // 저장 실패는 게임 진행을 막지 않는다
  }
}

export async function loadRun(): Promise<RunState | null> {
  try {
    const salt = await getSalt();
    const raw = await platform.load(KEY_RUN);
    if (!raw) return null;
    return await decryptSave<RunState>(raw, salt);
  } catch {
    return null;
  }
}

export async function saveRun(run: RunState | null): Promise<void> {
  try {
    if (run === null) {
      await platform.remove(KEY_RUN);
      return;
    }
    const salt = await getSalt();
    const encrypted = await encryptSave(run, salt);
    await platform.save(KEY_RUN, encrypted);
  } catch {
    // 저장 실패는 게임 진행을 막지 않는다
  }
}

export async function hasSavedRun(): Promise<boolean> {
  const raw = await platform.load(KEY_RUN);
  return !!raw;
}
