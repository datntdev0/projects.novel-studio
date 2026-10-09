import { ChangeDetectionStrategy, afterRenderEffect, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { SHORTCUT_CONTEXT } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { MODULE_REGISTRY } from '../registry/module-registry';
import { ShellStore } from '../shell.store';
import { KeysComponent } from './keys.component';
import { buildSections, filterSections, type PaletteItem } from './palette-search';
import { PaletteService } from './palette.service';

interface PaletteGroup {
  id: string;
  title: string;
  items: { item: PaletteItem; index: number }[];
}

@Component({
  selector: 'ns-palette',
  imports: [IconComponent, KeysComponent],
  templateUrl: './palette.component.html',
  styleUrl: './palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteComponent {
  protected readonly palette = inject(PaletteService);
  protected readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  private readonly store = inject(ShellStore);
  private readonly context = inject(SHORTCUT_CONTEXT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly query = signal('');
  protected readonly selected = signal(0);
  private readonly isOpen = computed(() => this.palette.state() !== null);

  private readonly sections = computed(() => {
    const state = this.palette.state();
    if (state === null) {
      return [];
    }
    const source = {
      modules: MODULE_REGISTRY,
      commands: this.commands.commands(),
      novels: this.store.novels(),
      novelOpen: this.context.novelOpen(),
      activeScope: this.context.activeScope(),
      filter: state.filter,
    };
    return filterSections(buildSections(source, this.i18n.language()), this.query());
  });

  protected readonly groups = computed<PaletteGroup[]>(() => {
    let index = 0;
    return this.sections().map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items.map((item) => ({ item, index: index++ })),
    }));
  });

  private readonly flat = computed(() => this.sections().flatMap((section) => section.items));

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.query.set('');
      }
    });
    effect(() => {
      this.groups();
      this.selected.set(0);
    });
    effect(() => {
      this.input()?.nativeElement.focus();
    });
    afterRenderEffect(() => {
      this.selected();
      this.host.nativeElement.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.run(this.selected());
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearFilter(): void {
    this.palette.setFilter('all');
    this.input()?.nativeElement.focus();
  }

  protected run(index: number): void {
    const item = this.flat()[index];
    if (item === undefined) {
      return;
    }
    this.palette.close();
    if (item.action.kind === 'command') {
      this.commands.run(item.action.id);
    } else {
      void this.store.open(item.action.id);
    }
  }

  private move(step: number): void {
    const count = this.flat().length;
    if (count === 0) {
      return;
    }
    this.selected.set((this.selected() + step + count) % count);
  }
}
