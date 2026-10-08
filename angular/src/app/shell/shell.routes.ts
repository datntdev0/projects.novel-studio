import { Routes } from '@angular/router';
import { ModuleHostComponent } from './module-host.component';
import { novelScopeGuard } from './novel-scope.guard';
import { MODULE_REGISTRY } from './registry/module-registry';

export const SHELL_ROUTES: Routes = [
  ...MODULE_REGISTRY.map((entry) => ({
    path: entry.id,
    component: ModuleHostComponent,
    canActivate: [novelScopeGuard],
    data: { moduleId: entry.id },
  })),
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
