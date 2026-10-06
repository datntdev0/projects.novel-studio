import { ErrorHandler, makeEnvironmentProviders, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { listenForCspViolations } from './csp-listener';
import { GlobalErrorHandler } from './global-error-handler';

export const provideErrorHandling = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideEnvironmentInitializer(listenForCspViolations),
  ]);
