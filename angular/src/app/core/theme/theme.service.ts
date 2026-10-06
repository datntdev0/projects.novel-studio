import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject } from '@angular/core';
import { applyTheme, type Theme } from '@shared/core';
import { SettingsService } from '../settings/settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly settings = inject(SettingsService);
  private readonly document = inject(DOCUMENT);
  readonly theme = computed(() => this.settings.settings().theme);

  constructor() {
    effect(() => {
      if (this.settings.loaded()) {
        applyTheme(this.document.documentElement, this.theme());
      }
    });
  }

  setTheme(theme: Theme): Promise<void> {
    return this.settings.update({ theme });
  }
}
