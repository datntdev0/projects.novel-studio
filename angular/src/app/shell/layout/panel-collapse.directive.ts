import { Directive, computed, inject, input } from '@angular/core';
import { PanelSide } from '@shared/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { commandTitle } from '../palette/palette-search';
import { LayoutStore, TOGGLE_COMMAND_IDS } from './layout.store';

@Directive({ selector: '[nsPanelCollapse]', host: { '[attr.title]': 'title()', '(click)': 'collapse()' } })
export class PanelCollapseDirective {
  private readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  private readonly layout = inject(LayoutStore);
  readonly nsPanelCollapse = input.required<PanelSide>();
  protected readonly title = computed(() =>
    commandTitle(this.i18n.t('layout.collapse'), this.commands.commands(), TOGGLE_COMMAND_IDS[this.nsPanelCollapse()]),
  );

  protected collapse(): void {
    void this.layout.toggle(this.nsPanelCollapse());
  }
}
