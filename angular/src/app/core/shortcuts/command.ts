import { InjectionToken, Signal } from '@angular/core';

export interface Command {
  id: string;
  labelKey: string;
  keywords: string[];
  keys: string[];
  scope: string;
  needsNovel: boolean;
  run: () => void;
}

export const GLOBAL_SCOPE = 'global';

export interface ShortcutContext {
  activeScope: Signal<string>;
  novelOpen: Signal<boolean>;
}

export const SHORTCUT_CONTEXT = new InjectionToken<ShortcutContext>('ShortcutContext');
