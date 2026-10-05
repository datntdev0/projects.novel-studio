import { Component, inject, OnInit, signal } from '@angular/core';
import { APP_NAME, type AppInfo } from '@shared/core';
import { BRIDGE } from '../core/bridge/bridge.token';

@Component({ selector: 'app-root-view', templateUrl: './root-view.component.html' })
export class RootViewComponent implements OnInit {
  private readonly bridge = inject(BRIDGE);
  readonly title = APP_NAME;
  readonly info = signal<AppInfo | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.info.set(await this.bridge.invoke('app:getInfo', null));
    } catch {
      return;
    }
  }
}
