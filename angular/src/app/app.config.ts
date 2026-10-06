import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideBridge } from './core/bridge/bridge.provider';
import { provideErrorHandling } from './core/errors/error-handling.provider';
import { provideI18n } from './core/i18n/i18n.provider';
import { provideSettings } from './core/settings/settings.provider';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideBridge(), provideErrorHandling(), provideSettings(), provideI18n()],
};
