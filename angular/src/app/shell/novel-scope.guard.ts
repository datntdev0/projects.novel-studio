import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { findEntry } from './registry/module-registry';
import { ShellStore } from './shell.store';

export const novelScopeGuard: CanActivateFn = (route) => {
  const entry = findEntry(route.data['moduleId']);
  if (entry?.scope !== 'novel' || inject(ShellStore).openNovel() !== null) {
    return true;
  }
  return inject(Router).createUrlTree(['/home']);
};
