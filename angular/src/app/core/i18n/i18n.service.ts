import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject } from '@angular/core';
import { formatDate, formatNumber, translate, type Language, type TranslateParams } from '@shared/core';
import { SettingsService } from '../settings/settings.service';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly settings = inject(SettingsService);
  private readonly document = inject(DOCUMENT);
  readonly language = computed(() => this.settings.settings().language);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
    });
  }

  t(key: string, params?: TranslateParams): string {
    return translate(this.language(), key, params);
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(this.language(), value, options);
  }

  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    return formatDate(this.language(), value, options);
  }

  setLanguage(language: Language): Promise<void> {
    return this.settings.update({ language });
  }
}
