import type { Theme } from './ipc-contract';

export interface ThemeTarget {
  setAttribute(name: string, value: string): void;
  style: { colorScheme: string };
}

export const THEME_BACKGROUNDS: Record<Theme, string> = { dark: '#101211', light: '#ffffff' };

export function applyTheme(target: ThemeTarget, theme: Theme): void {
  target.setAttribute('data-theme', theme);
  target.setAttribute('data-bs-theme', theme);
  target.style.colorScheme = theme;
}
