import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { PALETTE_COMMAND_ID } from '../palette/palette-search';
import { PaletteService } from '../palette/palette.service';

export const overlayCommands = (palette: PaletteService): Command[] => [
  {
    id: PALETTE_COMMAND_ID,
    labelKey: 'command.palette',
    keywords: ['command', 'palette', 'search'],
    keys: ['Ctrl+K'],
    scope: GLOBAL_SCOPE,
    needsNovel: false,
    run: () => palette.open(),
  },
];

export const provideOverlayCommands = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => void inject(CommandService).register(overlayCommands(inject(PaletteService))));
