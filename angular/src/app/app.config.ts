import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { provideBridge } from './core/bridge/bridge.provider';
import { provideErrorHandling } from './core/errors/error-handling.provider';
import { provideI18n } from './core/i18n/i18n.provider';
import { provideSettings } from './core/settings/settings.provider';
import { provideShortcuts } from './core/shortcuts/shortcuts.provider';
import { provideTheme } from './core/theme/theme.provider';
import { provideShortcutContext } from './shell/commands/shortcut-context.provider';
import { provideIconSprite } from './components/icon/icon-sprite.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideBridge(),
    provideErrorHandling(),
    provideSettings(),
    provideI18n(),
    provideTheme(),
    provideIconSprite(),
    provideShortcutContext(),
    provideShortcuts(),
  ],
};
