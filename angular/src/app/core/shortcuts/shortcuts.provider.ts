import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { CommandService } from './command.service';

export const provideShortcuts = (): EnvironmentProviders => provideEnvironmentInitializer(() => void inject(CommandService));
