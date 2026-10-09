import { inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import { CommandService } from '../../core/shortcuts/command.service';
import { ToastService } from '../feedback/toast.service';
import { showOpenNovelFirst } from '../novel-scope.guard';

export const provideNovelGuardToast = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => {
    const toast = inject(ToastService);
    inject(CommandService).refused.subscribe(() => showOpenNovelFirst(toast));
  });
