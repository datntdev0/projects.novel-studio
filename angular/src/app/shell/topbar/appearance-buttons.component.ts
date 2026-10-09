import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonDirective } from '../../components/button/button.directive';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';
import { CommandService } from '../../core/shortcuts/command.service';

@Component({
  selector: 'ns-appearance-buttons',
  imports: [ButtonDirective, IconComponent],
  template: `
    <button
      nsBtn
      variant="ghost"
      size="sm"
      class="lang"
      data-testid="topbar-lang"
      title="Ctrl+Shift+U"
      [attr.aria-label]="i18n.t('topbar.language')"
      (click)="commands.run('appearance.toggle-language')"
    >
      <ns-icon name="languages" size="sm" />
      <span>{{ i18n.language().toUpperCase() }}</span>
    </button>
    <button
      nsBtn
      variant="ghost"
      iconOnly
      data-testid="topbar-theme"
      title="Ctrl+Shift+L"
      [attr.aria-label]="i18n.t('topbar.theme')"
      (click)="commands.run('appearance.toggle-theme')"
    >
      <ns-icon [name]="themeIcon()" />
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: none;
    }
    .lang {
      width: 56px;
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceButtonsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly commands = inject(CommandService);
  private readonly theme = inject(ThemeService);
  protected readonly themeIcon = computed(() => (this.theme.theme() === 'dark' ? 'moon' : 'sun'));
}
