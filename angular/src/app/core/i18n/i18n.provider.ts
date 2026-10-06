import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { I18nService } from './i18n.service';

export const provideI18n = (): EnvironmentProviders => provideEnvironmentInitializer(() => void inject(I18nService));
