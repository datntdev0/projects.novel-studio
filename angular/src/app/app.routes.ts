import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { SHELL_ROUTES } from './shell/shell.routes';

export const APP_ROUTES: Routes = [{ path: '', component: ShellComponent, children: SHELL_ROUTES }];
