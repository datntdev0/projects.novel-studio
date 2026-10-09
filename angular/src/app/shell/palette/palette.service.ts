import { Injectable, inject, signal } from '@angular/core';
import { LayerService } from '../../core/shortcuts/layer.service';
import type { PaletteFilter } from './palette-search';

export interface PaletteState {
  filter: PaletteFilter;
}

@Injectable({ providedIn: 'root' })
export class PaletteService {
  private readonly layers = inject(LayerService);
  private readonly current = signal<PaletteState | null>(null);
  private opener: Element | null = null;
  private releaseLayer: (() => void) | null = null;

  readonly state = this.current.asReadonly();

  open(filter: PaletteFilter = 'all'): void {
    if (this.current() === null) {
      this.opener = document.activeElement;
      this.releaseLayer = this.layers.push(() => this.close());
    }
    this.setFilter(filter);
  }

  setFilter(filter: PaletteFilter): void {
    this.current.set({ filter });
  }

  close(): void {
    if (this.current() === null) {
      return;
    }
    this.releaseLayer?.();
    this.releaseLayer = null;
    this.current.set(null);
    if (this.opener instanceof HTMLElement && this.opener.isConnected) {
      this.opener.focus();
    }
    this.opener = null;
  }
}
