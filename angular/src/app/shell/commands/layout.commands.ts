import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import type { PanelSide } from '@shared/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { LayoutStore, TOGGLE_COMMAND_IDS } from '../layout/layout.store';

const toggleCommand = (layout: LayoutStore, side: PanelSide, labelKey: string, key: string, keyword: string): Command => ({
  id: TOGGLE_COMMAND_IDS[side],
  labelKey,
  keywords: ['panel', keyword],
  keys: [key],
  scope: GLOBAL_SCOPE,
  needsNovel: false,
  run: () => void layout.toggle(side),
});

export const layoutCommands = (layout: LayoutStore): Command[] => [
  toggleCommand(layout, 'left', 'command.toggleLeft', 'Ctrl+B', 'sidebar'),
  toggleCommand(layout, 'right', 'command.toggleRight', 'Ctrl+Alt+B', 'inspector'),
  toggleCommand(layout, 'bottom', 'command.toggleBottom', 'Ctrl+J', 'bottom'),
];

export const provideLayoutCommands = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => void inject(CommandService).register(layoutCommands(inject(LayoutStore))));
