import { type Routes } from '@angular/router';

export const devRoutes: Routes = [
  { path: 'dev/kit', loadComponent: () => import('./kit/kit-page.component').then((m) => m.KitPageComponent) },
];
