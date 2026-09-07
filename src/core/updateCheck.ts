// 안드로이드(사이드로드 APK)와 웹 빌드를 위한 업데이트 확인.
// Electron은 electron-updater가 백그라운드에서 자동으로 처리하므로 이 모듈을 쓰지 않는다.
//
// 안드로이드는 Play 스토어를 거치지 않는 사이드로드 배포이기 때문에 OS 차원의 자동 설치가
// 불가능하다 (REQUEST_INSTALL_PACKAGES 권한 + 사용자 확인이 항상 필요). 그래서 여기서는
// "새 버전이 있다"는 사실만 알리고 다운로드 링크로 안내하는 반자동 방식으로 구현한다.

export const CURRENT_VERSION = __APP_VERSION__;

export interface UpdateInfo {
  available: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseUrl?: string;
}

function parseVersion(v: string): number[] {
  return v
    .replace(/^v/, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetch('https://api.github.com/repos/anaf-4/RIFTLINE/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { available: false };
    const data = await res.json();
    const tag: string = data.tag_name ?? '';
    if (!tag || !isNewer(tag, CURRENT_VERSION)) return { available: false };

    const apkAsset = (data.assets ?? []).find((a: { name: string }) => a.name.endsWith('.apk'));
    return {
      available: true,
      latestVersion: tag,
      downloadUrl: apkAsset?.browser_download_url,
      releaseUrl: data.html_url,
    };
  } catch {
    return { available: false }; // 오프라인이거나 API 실패 시 조용히 무시
  }
}
