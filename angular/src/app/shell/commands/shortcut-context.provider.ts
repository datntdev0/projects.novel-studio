import { computed, inject, type Provider } from '@angular/core';
import { SHORTCUT_CONTEXT, type ShortcutContext } from '../../core/shortcuts/command';
import { ShellStore } from '../shell.store';

export const provideShortcutContext = (): Provider => ({
  provide: SHORTCUT_CONTEXT,
  useFactory: (): ShortcutContext => {
    const store = inject(ShellStore);
    return { activeScope: store.activeModule, novelOpen: computed(() => store.openNovel() !== null) };
  },
});
