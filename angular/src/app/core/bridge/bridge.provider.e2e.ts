import { Provider } from '@angular/core';
import { BRIDGE } from './bridge.token';
import { BrowserBridge } from './browser-bridge';

export const provideBridge = (): Provider => ({ provide: BRIDGE, useFactory: () => new BrowserBridge() });
