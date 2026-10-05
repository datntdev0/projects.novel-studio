import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideBridge } from './core/bridge/bridge.provider';

export const appConfig: ApplicationConfig = { providers: [provideZonelessChangeDetection(), provideBridge()] };
