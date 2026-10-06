import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { ThemeService } from './theme.service';

export const provideTheme = (): EnvironmentProviders => provideEnvironmentInitializer(() => void inject(ThemeService));
