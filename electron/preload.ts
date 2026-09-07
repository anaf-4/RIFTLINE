import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('riftlineElectron', {
  save: (key: string, value: string): Promise<void> => ipcRenderer.invoke('rl-save', key, value),
  load: (key: string): Promise<string | null> => ipcRenderer.invoke('rl-load', key),
  remove: (key: string): Promise<void> => ipcRenderer.invoke('rl-remove', key),

  onUpdateAvailable: (cb: (version: string) => void) => {
    ipcRenderer.on('rl-update-available', (_e, version: string) => cb(version));
  },
  onUpdateDownloaded: (cb: (version: string) => void) => {
    ipcRenderer.on('rl-update-downloaded', (_e, version: string) => cb(version));
  },
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('rl-update-download'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('rl-update-install'),
});
