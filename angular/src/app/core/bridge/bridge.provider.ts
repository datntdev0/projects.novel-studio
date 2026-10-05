import { Provider } from '@angular/core';
import { BRIDGE } from './bridge.token';
import { ElectronBridge } from './electron-bridge';

export const provideBridge = (): Provider => ({ provide: BRIDGE, useFactory: () => new ElectronBridge() });
