import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { PALETTE_COMMAND_ID, SHORTCUTS_COMMAND_ID } from '../palette/palette-search';
import { PaletteService } from '../palette/palette.service';
import { ShortcutSheetService } from '../shortcut-sheet/shortcut-sheet.service';

export const overlayCommands = (palette: PaletteService, sheet: ShortcutSheetService): Command[] => [
  {
    id: PALETTE_COMMAND_ID,
    labelKey: 'command.palette',
    keywords: ['command', 'palette', 'search'],
    keys: ['Ctrl+K'],
    scope: GLOBAL_SCOPE,
    needsNovel: false,
    run: () => {
      palette.open('all', sheet.hide());
    },
  },
  {
    id: SHORTCUTS_COMMAND_ID,
    labelKey: 'command.shortcuts',
    keywords: ['keyboard', 'shortcuts', 'keys', 'help'],
    keys: ['Ctrl+/', '?'],
    scope: GLOBAL_SCOPE,
    needsNovel: false,
    run: () => {
      palette.close();
      sheet.show();
    },
  },
];

export const provideOverlayCommands = (): EnvironmentProviders =>
  provideEnvironmentInitializer(
    () => void inject(CommandService).register(overlayCommands(inject(PaletteService), inject(ShortcutSheetService))),
  );
