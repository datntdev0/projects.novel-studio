import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { KeysComponent } from './keys.component';
import { commandKeys, PALETTE_COMMAND_ID } from './palette-search';

@Component({
  selector: 'ns-palette-button',
  imports: [IconComponent, KeysComponent],
  template: `
    <button class="palette-btn" data-testid="topbar-palette" [attr.title]="keys().join(', ')" (click)="commands.run(paletteId)">
      <ns-icon name="search" size="sm" />
      <span class="grow">{{ i18n.t('palette.button') }}</span>
      <ns-keys [chords]="keys()" />
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex: 0 1 300px;
      min-width: 180px;
      margin-right: var(--sp-sm);
    }
    .palette-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-sm);
      width: 100%;
      height: 28px;
      padding: 0 var(--sp-sm) 0 var(--sp-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-background);
      color: var(--color-text-tertiary);
      cursor: text;
      text-align: left;
    }
    .palette-btn:hover {
      border-color: var(--color-border-strong);
    }
    .grow {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteButtonComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly commands = inject(CommandService);
  protected readonly paletteId = PALETTE_COMMAND_ID;
  protected readonly keys = computed(() => commandKeys(this.commands.commands(), PALETTE_COMMAND_ID));
}
