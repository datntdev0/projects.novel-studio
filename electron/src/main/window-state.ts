import { screen, type BrowserWindow } from 'electron';
import type { WindowBounds } from '@shared/core';
import { getSettings, updateSettings } from './settings-store';

interface InitialBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

const isSameBounds = (a: WindowBounds | null, b: WindowBounds): boolean =>
  a !== null && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height && a.maximized === b.maximized;

function isOnScreen(saved: WindowBounds): boolean {
  return screen
    .getAllDisplays()
    .some(
      ({ workArea }) =>
        saved.x < workArea.x + workArea.width &&
        saved.x + saved.width > workArea.x &&
        saved.y < workArea.y + workArea.height &&
        saved.y + saved.height > workArea.y,
    );
}

export function initialBounds(): InitialBounds {
  const saved = getSettings().windowBounds;
  if (!saved) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    return { width: Math.min(1440, width), height: Math.min(900, height) };
  }
  if (!isOnScreen(saved)) return { width: saved.width, height: saved.height };
  return { x: saved.x, y: saved.y, width: saved.width, height: saved.height };
}

export function trackWindowState(window: BrowserWindow): void {
  if (getSettings().windowBounds?.maximized) window.maximize();
  const save = (): void => {
    if (window.isMinimized()) return;
    const current: WindowBounds = { ...window.getNormalBounds(), maximized: window.isMaximized() };
    if (!isSameBounds(getSettings().windowBounds, current)) updateSettings({ windowBounds: current });
  };
  window.on('resized', save);
  window.on('moved', save);
  window.on('maximize', save);
  window.on('unmaximize', save);
  window.on('close', save);
}
