import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PanelSide } from '@shared/core';
import { ButtonDirective } from '../../components/button/button.directive';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { LayoutStore, TOGGLE_COMMAND_IDS } from '../layout/layout.store';
import { commandTitle } from '../palette/palette-search';

const TOGGLES: { side: PanelSide; labelKey: string }[] = [
  { side: 'left', labelKey: 'command.toggleLeft' },
  { side: 'bottom', labelKey: 'command.toggleBottom' },
  { side: 'right', labelKey: 'command.toggleRight' },
];

@Component({
  selector: 'ns-panel-toggles',
  imports: [ButtonDirective, IconComponent],
  template: `
    <div class="panel-toggles" data-testid="topbar-panel-toggles">
      @for (toggle of toggles; track toggle.side) {
        @if (layout.shown()[toggle.side]) {
          <button
            nsBtn
            variant="ghost"
            iconOnly
            [attr.data-testid]="'topbar-toggle-' + toggle.side"
            [attr.aria-pressed]="layout.open()[toggle.side]"
            [attr.aria-label]="label(toggle.labelKey)"
            [attr.title]="title(toggle.side, toggle.labelKey)"
            (click)="layout.toggle(toggle.side)"
          >
            <ns-icon [name]="'panel-' + toggle.side" />
          </button>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      flex: none;
    }
    .panel-toggles {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelTogglesComponent {
  private readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  protected readonly layout = inject(LayoutStore);
  protected readonly toggles = TOGGLES;

  protected label(key: string): string {
    return this.i18n.t(key);
  }

  protected title(side: PanelSide, key: string): string {
    return commandTitle(this.label(key), this.commands.commands(), TOGGLE_COMMAND_IDS[side]);
  }
}
