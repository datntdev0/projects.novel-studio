import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../app/core/i18n/t.pipe';
import { ProbeModuleCommands } from './probe-module-commands.service';
import { PaletteService } from '../../../app/shell/palette/palette.service';

@Component({ selector: 'ns-probe-shortcuts', imports: [TranslatePipe], templateUrl: './probe-shortcuts.component.html' })
export class ProbeShortcutsComponent {
  protected readonly moduleCommands = inject(ProbeModuleCommands);
  protected readonly palette = inject(PaletteService);
}
