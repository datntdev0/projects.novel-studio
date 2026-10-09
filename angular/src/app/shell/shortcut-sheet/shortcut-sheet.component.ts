import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DialogComponent } from '../../components/overlay/dialog.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { SHORTCUT_CONTEXT } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { KeysComponent } from '../palette/keys.component';
import { MODULE_REGISTRY } from '../registry/module-registry';
import { buildSheetGroups } from './sheet-groups';
import { ShortcutSheetService } from './shortcut-sheet.service';

@Component({
  selector: 'ns-shortcut-sheet',
  imports: [DialogComponent, KeysComponent],
  templateUrl: './shortcut-sheet.component.html',
  styleUrl: './shortcut-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutSheetComponent {
  protected readonly sheet = inject(ShortcutSheetService);
  protected readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  private readonly context = inject(SHORTCUT_CONTEXT);

  protected readonly groups = computed(() =>
    this.sheet.visible()
      ? buildSheetGroups(this.commands.commands(), MODULE_REGISTRY, this.context.activeScope(), this.i18n.language())
      : [],
  );
}
