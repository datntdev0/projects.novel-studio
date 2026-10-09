import { Injectable, Signal, computed, inject, linkedSignal, signal } from '@angular/core';
import { PANEL_SIDES, PanelSide, ScreenLayout } from '@shared/core';
import { LayerService } from '../../core/shortcuts/layer.service';
import { SettingsService } from '../../core/settings/settings.service';
import { ToastService } from '../feedback/toast.service';
import { PanelSet, findEntry } from '../registry/module-registry';
import { ShellStore } from '../shell.store';

export const PANEL_LIMITS: Record<PanelSide, { min: number; max: number }> = {
  left: { min: 180, max: 480 },
  right: { min: 220, max: 520 },
  bottom: { min: 120, max: 480 },
};

export const TOGGLE_COMMAND_IDS: Record<PanelSide, string> = {
  left: 'layout.toggle-left',
  right: 'layout.toggle-right',
  bottom: 'layout.toggle-bottom',
};

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly settings = inject(SettingsService);
  private readonly shell = inject(ShellStore);
  private readonly layers = inject(LayerService);
  private readonly toast = inject(ToastService);
  private releaseLayer: (() => void) | null = null;
  private readonly focus = signal(false);
  readonly focusMode = this.focus.asReadonly();
  private readonly layouts = linkedSignal(() => this.settings.settings().layout);
  readonly railExpanded = computed(() => this.settings.settings().railExpanded);
  readonly shown: Signal<PanelSet> = computed(() => {
    const entry = findEntry(this.shell.activeModule());
    const hasContent = !!entry?.load;
    return {
      left: hasContent && !!entry?.panels.left,
      right: hasContent && !!entry?.panels.right,
      bottom: hasContent && !!entry?.panels.bottom,
    };
  });
  readonly current: Signal<ScreenLayout> = computed(() => this.layouts()[this.shell.activeModule()] ?? {});
  readonly open: Signal<PanelSet> = computed(() => {
    const shown = this.shown();
    const collapsed = this.current().collapsed ?? [];
    return {
      left: shown.left && !collapsed.includes('left'),
      right: shown.right && !collapsed.includes('right'),
      bottom: shown.bottom && !collapsed.includes('bottom'),
    };
  });

  toggleRail(): Promise<void> {
    return this.settings.update({ railExpanded: !this.railExpanded() });
  }

  resize(side: PanelSide, px: number): void {
    const { min, max } = PANEL_LIMITS[side];
    this.setCurrent({ ...this.current(), [side]: Math.round(Math.min(max, Math.max(min, px))) });
  }

  save(): Promise<void> {
    return this.settings.update({ layout: this.layouts() });
  }

  resetPanel(side: PanelSide): Promise<void> {
    const next = { ...this.current() };
    delete next[side];
    this.setCurrent(next);
    return this.save();
  }

  toggle(side: PanelSide): Promise<void> {
    if (!this.shown()[side]) return Promise.resolve();
    const collapsed = this.current().collapsed ?? [];
    const next = collapsed.includes(side) ? collapsed.filter((s) => s !== side) : [...collapsed, side];
    this.setCurrent({ ...this.current(), collapsed: PANEL_SIDES.filter((s) => next.includes(s)) });
    return this.save();
  }

  toggleFocus(): void {
    if (this.focus()) {
      this.leaveFocus();
      return;
    }
    this.releaseLayer = this.layers.push(() => this.leaveFocus());
    this.focus.set(true);
  }

  leaveFocus(): void {
    this.releaseLayer?.();
    this.releaseLayer = null;
    this.focus.set(false);
  }

  async reset(): Promise<void> {
    this.leaveFocus();
    await this.settings.update({ layout: {}, railExpanded: false });
    this.toast.show({ tone: 'success', titleKey: 'layout.resetDone' });
  }

  private setCurrent(screen: ScreenLayout): void {
    this.layouts.update((layouts) => ({ ...layouts, [this.shell.activeModule()]: screen }));
  }
}
