import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { CommandService } from '../../core/shortcuts/command.service';
import { ToastService } from '../feedback/toast.service';

export const provideNovelGuardToast = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => {
    const toast = inject(ToastService);
    inject(CommandService).refused.subscribe(() => toast.show({ tone: 'info', titleKey: 'shell.openNovelFirst' }));
  });
