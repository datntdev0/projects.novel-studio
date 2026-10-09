import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { findEntry } from './registry/module-registry';
import { ShellPanels } from './shell-panels';
import { ShellStore } from './shell.store';
import { ToastOutletComponent } from './feedback/toast-outlet.component';
import { ConfirmOutletComponent } from './feedback/confirm-outlet.component';
import { AppearanceButtonsComponent } from './topbar/appearance-buttons.component';
import { PaletteComponent } from './palette/palette.component';
import { PaletteButtonComponent } from './palette/palette-button.component';
import { ShortcutSheetComponent } from './shortcut-sheet/shortcut-sheet.component';
import { RailComponent } from './rail/rail.component';

@Component({
  selector: 'ns-shell',
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    ToastOutletComponent,
    ConfirmOutletComponent,
    AppearanceButtonsComponent,
    PaletteComponent,
    PaletteButtonComponent,
    ShortcutSheetComponent,
    RailComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly panels = inject(ShellPanels);
  private readonly store = inject(ShellStore);
  private readonly shown = computed(() => {
    const entry = findEntry(this.store.activeModule());
    const hasContent = !!entry?.load;
    return {
      left: hasContent && !!entry?.panels.left,
      right: hasContent && !!entry?.panels.right,
      bottom: hasContent && !!entry?.panels.bottom,
    };
  });
  protected readonly columns = computed(
    () => `var(--rail-w) ${this.shown().left ? 'var(--left-w)' : '0'} minmax(0, 1fr) ${this.shown().right ? 'var(--right-w)' : '0'}`,
  );
  protected readonly rows = computed(() => `var(--top-h) minmax(0, 1fr) ${this.shown().bottom ? 'var(--bottom-h)' : '0'} var(--status-h)`);

  constructor() {
    void this.store.load();
  }
}
