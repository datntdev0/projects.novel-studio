import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideBridge } from './core/bridge/bridge.provider';
import { provideErrorHandling } from './core/errors/error-handling.provider';
import { provideI18n } from './core/i18n/i18n.provider';
import { provideSettings } from './core/settings/settings.provider';
import { provideTheme } from './core/theme/theme.provider';
import { provideIconSprite } from './ui/icon/icon-sprite.provider';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideBridge(),
    provideErrorHandling(),
    provideSettings(),
    provideI18n(),
    provideTheme(),
    provideIconSprite(),
  ],
};
