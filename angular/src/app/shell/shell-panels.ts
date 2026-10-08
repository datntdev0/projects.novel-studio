import { Injectable, TemplateRef, signal } from '@angular/core';

export type PanelSide = 'left' | 'right' | 'bottom';

@Injectable({ providedIn: 'root' })
export class ShellPanels {
  readonly left = signal<TemplateRef<unknown> | null>(null);
  readonly right = signal<TemplateRef<unknown> | null>(null);
  readonly bottom = signal<TemplateRef<unknown> | null>(null);

  set(side: PanelSide, template: TemplateRef<unknown> | null): void {
    this[side].set(template);
  }

  clear(): void {
    this.left.set(null);
    this.right.set(null);
    this.bottom.set(null);
  }
}
