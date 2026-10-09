import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from './feedback/toast.service';
import { findEntry } from './registry/module-registry';
import { ShellStore } from './shell.store';

export const showOpenNovelFirst = (toast: ToastService) => toast.show({ tone: 'info', titleKey: 'shell.openNovelFirst' });

export const novelScopeGuard: CanActivateFn = (route) => {
  const entry = findEntry(route.data['moduleId']);
  if (entry?.scope !== 'novel' || inject(ShellStore).openNovel() !== null) {
    return true;
  }
  showOpenNovelFirst(inject(ToastService));
  return inject(Router).createUrlTree(['/home']);
};
