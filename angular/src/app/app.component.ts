import { Component } from '@angular/core';
import { APP_NAME } from '@shared/core';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  readonly appName = APP_NAME;
}
