import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// electron-updater는 CommonJS 모듈이라 이름 있는 내보내기(named export)를
// ESM에서 바로 가져올 수 없다. 기본 내보내기를 받아 구조 분해해야 한다.
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 자동 업데이트: NSIS 설치본에서만 동작한다 (포터블 exe는 electron-updater가 지원하지 않는다).
// GitHub Releases에 새 버전이 올라오면 감지해서 렌더러에 알리고, 사용자가 "업데이트" 버튼을
// 눌러야 실제로 다운로드를 시작한다 (자동으로 조용히 받지 않는다). 다운로드가 끝나면 다시
// 알려서 "지금 재시작" 버튼으로 설치하거나, 누르지 않으면 앱을 종료할 때 자동 설치된다.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  if (!app.isPackaged) return; // 개발 모드에서는 건너뛴다

  const send = (channel: string, ...args: unknown[]) => {
    const win = BrowserWindow.getAllWindows()[0];
    win?.webContents.send(channel, ...args);
  };

  autoUpdater.on('error', (err) => {
    console.error('[auto-update] error:', err);
  });
  autoUpdater.on('update-available', (info) => {
    console.log('[auto-update] update available:', info.version);
    send('rl-update-available', info.version);
  });
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[auto-update] downloaded, ready to install:', info.version);
    send('rl-update-downloaded', info.version);
  });

  ipcMain.handle('rl-update-download', () => autoUpdater.downloadUpdate());
  ipcMain.handle('rl-update-install', () => autoUpdater.quitAndInstall());

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[auto-update] check failed:', err);
  });

  // 이후 6시간마다 재확인 (장시간 켜두는 사용자를 위해)
  setInterval(
    () => {
      autoUpdater.checkForUpdates().catch(() => {});
    },
    6 * 60 * 60 * 1000
  );
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function savesDir(): string {
  return path.join(app.getPath('userData'), 'saves');
}

async function ensureSavesDir() {
  await fs.mkdir(savesDir(), { recursive: true });
}

ipcMain.handle('rl-save', async (_e, key: string, value: string) => {
  await ensureSavesDir();
  await fs.writeFile(path.join(savesDir(), `${sanitizeKey(key)}.sav`), value, 'utf-8');
});

ipcMain.handle('rl-load', async (_e, key: string): Promise<string | null> => {
  try {
    return await fs.readFile(path.join(savesDir(), `${sanitizeKey(key)}.sav`), 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.handle('rl-remove', async (_e, key: string) => {
  try {
    await fs.unlink(path.join(savesDir(), `${sanitizeKey(key)}.sav`));
  } catch {
    // 파일이 없어도 무시
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    autoHideMenuBar: true,
    backgroundColor: '#12141A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
