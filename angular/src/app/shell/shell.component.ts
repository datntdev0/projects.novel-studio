import { Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ShellPanels } from './shell-panels';
import { ShellStore } from './shell.store';
import { ToastOutletComponent } from './feedback/toast-outlet.component';
import { ConfirmOutletComponent } from './feedback/confirm-outlet.component';
import { AppearanceButtonsComponent } from './topbar/appearance-buttons.component';
import { SettingsButtonComponent } from './topbar/settings-button.component';
import { PaletteComponent } from './palette/palette.component';
import { PaletteButtonComponent } from './palette/palette-button.component';
import { ShortcutSheetComponent } from './shortcut-sheet/shortcut-sheet.component';
import { RailComponent } from './rail/rail.component';
import { BrandComponent } from './topbar/brand.component';
import { CrumbsComponent } from './topbar/crumbs.component';
import { LayoutStore } from './layout/layout.store';
import { StatusBarComponent } from './status/status-bar.component';
import { ResizerDirective } from './layout/resizer.directive';
import { PanelTogglesComponent } from './topbar/panel-toggles.component';
import { FocusBarComponent } from './layout/focus-bar.component';

@Component({
  selector: 'ns-shell',
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    ToastOutletComponent,
    ConfirmOutletComponent,
    AppearanceButtonsComponent,
    SettingsButtonComponent,
    PaletteComponent,
    PaletteButtonComponent,
    ShortcutSheetComponent,
    RailComponent,
    BrandComponent,
    CrumbsComponent,
    StatusBarComponent,
    ResizerDirective,
    PanelTogglesComponent,
    FocusBarComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly panels = inject(ShellPanels);
  protected readonly layout = inject(LayoutStore);
  private readonly store = inject(ShellStore);
  constructor() {
    void this.store.load();
  }
}
