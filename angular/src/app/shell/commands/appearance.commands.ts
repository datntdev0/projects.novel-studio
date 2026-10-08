import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { CommandService } from '../../core/shortcuts/command.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';

export const appearanceCommands = (i18n: I18nService, theme: ThemeService): Command[] => [
  {
    id: 'appearance.toggle-language',
    labelKey: 'command.toggleLanguage',
    keywords: ['language', 'vietnamese', 'english'],
    keys: ['Ctrl+Shift+U'],
    scope: GLOBAL_SCOPE,
    needsNovel: false,
    run: () => void i18n.setLanguage(i18n.language() === 'en' ? 'vi' : 'en'),
  },
  {
    id: 'appearance.toggle-theme',
    labelKey: 'command.toggleTheme',
    keywords: ['theme', 'dark', 'light'],
    keys: ['Ctrl+Shift+L'],
    scope: GLOBAL_SCOPE,
    needsNovel: false,
    run: () => void theme.setTheme(theme.theme() === 'dark' ? 'light' : 'dark'),
  },
];

export const provideAppearanceCommands = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => void inject(CommandService).register(appearanceCommands(inject(I18nService), inject(ThemeService))));
