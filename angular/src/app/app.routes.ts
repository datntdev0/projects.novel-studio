import { type Routes } from '@angular/router';
import { devRoutes } from './dev/dev.routes';
import { RootViewComponent } from './root-view/root-view.component';

export const routes: Routes = [...devRoutes, { path: '', component: RootViewComponent }, { path: '**', redirectTo: '' }];
