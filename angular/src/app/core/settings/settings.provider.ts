import { inject, provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { SettingsService } from './settings.service';

export const provideSettings = (): EnvironmentProviders => provideAppInitializer(() => inject(SettingsService).load());
