import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
