import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('riftlineElectron', {
  save: (key: string, value: string): Promise<void> => ipcRenderer.invoke('rl-save', key, value),
  load: (key: string): Promise<string | null> => ipcRenderer.invoke('rl-load', key),
  remove: (key: string): Promise<void> => ipcRenderer.invoke('rl-remove', key),
});
