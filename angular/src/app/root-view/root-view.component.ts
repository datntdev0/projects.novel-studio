import { Component, inject, OnInit, signal } from '@angular/core';
import { APP_NAME, type AppInfo } from '@shared/core';
import { BRIDGE } from '../core/bridge/bridge.token';
import { ErrorService } from '../core/errors/error.service';

@Component({ selector: 'app-root-view', templateUrl: './root-view.component.html' })
export class RootViewComponent implements OnInit {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  readonly title = APP_NAME;
  readonly info = signal<AppInfo | null>(null);
  readonly lastError = this.errors.lastError;

  async ngOnInit(): Promise<void> {
    try {
      this.info.set(await this.bridge.invoke('app:getInfo', null));
    } catch (error) {
      this.errors.report(error);
    }
  }
}
