import { Component, inject, OnInit, signal } from '@angular/core';
import { APP_NAME, type AppInfo } from '@shared/core';
import { BRIDGE } from '../core/bridge/bridge.token';
import { ErrorService } from '../core/errors/error.service';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/t.pipe';
import { SettingsService } from '../core/settings/settings.service';

@Component({ selector: 'app-root-view', imports: [TranslatePipe], templateUrl: './root-view.component.html' })
export class RootViewComponent implements OnInit {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  protected readonly i18n = inject(I18nService);
  protected readonly settings = inject(SettingsService);
  readonly title = APP_NAME;
  readonly sampleDate = new Date(2026, 2, 5);
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
