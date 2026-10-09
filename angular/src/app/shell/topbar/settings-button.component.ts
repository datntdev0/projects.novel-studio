import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonDirective } from '../../components/button/button.directive';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { navCommandId } from '../commands/navigation.commands';
import { commandTitle } from '../palette/palette-search';

@Component({
  selector: 'ns-settings-button',
  imports: [ButtonDirective, IconComponent],
  template: `
    <button
      nsBtn
      variant="ghost"
      iconOnly
      data-testid="topbar-settings"
      [attr.aria-label]="label()"
      [attr.title]="title()"
      (click)="open()"
    >
      <ns-icon name="settings" />
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      flex: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsButtonComponent {
  private readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  protected readonly label = computed(() => this.i18n.t('module.settings.label'));
  protected readonly title = computed(() => commandTitle(this.label(), this.commands.commands(), navCommandId('settings')));

  protected open(): void {
    this.commands.run(navCommandId('settings'));
  }
}
