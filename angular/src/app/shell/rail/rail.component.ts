import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { CommandService } from '../../core/shortcuts/command.service';
import { navCommandId } from '../commands/navigation.commands';
import { commandKeys } from '../palette/palette-search';
import { groupEntries, MODULE_REGISTRY, RAIL_GROUPS, type ModuleEntry, type RailGroup } from '../registry/module-registry';
import { ShellStore } from '../shell.store';

interface RailSection {
  group: RailGroup;
  entries: ModuleEntry[];
}

@Component({
  selector: 'ns-rail',
  imports: [IconComponent, NgTemplateOutlet, TranslatePipe],
  templateUrl: './rail.component.html',
  styleUrl: './rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent {
  protected readonly store = inject(ShellStore);
  private readonly commands = inject(CommandService);
  private readonly i18n = inject(I18nService);
  readonly expanded = input(false);

  private readonly sections = computed<RailSection[]>(() => {
    const novelOpen = this.store.openNovel() !== null;
    return RAIL_GROUPS.map((group) => ({ group, entries: groupEntries(MODULE_REGISTRY, group, novelOpen) })).filter(
      (section) => section.entries.length > 0,
    );
  });

  protected readonly top = this.pick((group) => group === 'library');
  protected readonly scrollable = this.pick((group) => group !== 'library' && group !== 'system');
  protected readonly bottom = this.pick((group) => group === 'system');

  private pick(test: (group: RailGroup) => boolean) {
    return computed(() => this.sections().filter((section) => test(section.group)));
  }

  protected tooltip(entry: ModuleEntry): string {
    const label = this.i18n.t(entry.labelKey);
    const key = commandKeys(this.commands.commands(), navCommandId(entry.id))[0];
    return key === undefined ? label : `${label} · ${key}`;
  }

  protected go(entry: ModuleEntry): void {
    this.commands.run(navCommandId(entry.id));
  }
}
