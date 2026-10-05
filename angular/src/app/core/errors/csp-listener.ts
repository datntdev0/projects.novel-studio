import { DOCUMENT, inject } from '@angular/core';
import { BRIDGE } from '../bridge/bridge.token';
import { writeLog } from './write-log';

export const listenForCspViolations = (): void => {
  const bridge = inject(BRIDGE);
  inject(DOCUMENT).addEventListener('securitypolicyviolation', (event) => {
    writeLog(bridge, { level: 'warn', message: `blocked csp ${event.effectiveDirective} ${event.blockedURI}` });
  });
};
