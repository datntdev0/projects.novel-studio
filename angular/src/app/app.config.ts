import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideBridge } from './core/bridge/bridge.provider';
import { provideErrorHandling } from './core/errors/error-handling.provider';

export const appConfig: ApplicationConfig = { providers: [provideZonelessChangeDetection(), provideBridge(), provideErrorHandling()] };
