import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { MODULE_REGISTRY } from '../registry/module-registry';
import { ShellStore } from '../shell.store';

export const navigationCommands = (store: ShellStore): Command[] =>
  MODULE_REGISTRY.map((entry) => ({
    id: `nav.${entry.id}`,
    labelKey: entry.labelKey,
    keywords: entry.keywords,
    keys: entry.keys,
    scope: GLOBAL_SCOPE,
    needsNovel: entry.scope === 'novel',
    run: () => store.go(entry.id),
  }));

export const provideNavigationCommands = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => void inject(CommandService).register(navigationCommands(inject(ShellStore))));
