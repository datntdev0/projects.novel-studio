import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { APP_NAME, type AppInfo, type BackendStatus, type LibraryStatus, type SystemStatus } from '@shared/core';
import { BRIDGE } from '../../../app/core/bridge/bridge.token';
import { ErrorService } from '../../../app/core/errors/error.service';
import { I18nService } from '../../../app/core/i18n/i18n.service';
import { TranslatePipe } from '../../../app/core/i18n/t.pipe';
import { SettingsService } from '../../../app/core/settings/settings.service';
import { ThemeService } from '../../../app/core/theme/theme.service';
import { IconComponent } from '../../../app/components/icon/icon.component';

@Component({ selector: 'ns-probe-foundation', imports: [TranslatePipe, IconComponent], templateUrl: './probe-foundation.component.html' })
export class ProbeFoundationComponent implements OnInit {
  private readonly bridge = inject(BRIDGE);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errors = inject(ErrorService);
  protected readonly i18n = inject(I18nService);
  protected readonly settings = inject(SettingsService);
  protected readonly theme = inject(ThemeService);
  readonly title = APP_NAME;
  readonly sampleDate = new Date(2026, 2, 5);
  readonly info = signal<AppInfo | null>(null);
  readonly library = signal<LibraryStatus | null>(null);
  readonly backend = signal<BackendStatus | null>(null);
  readonly system = signal<SystemStatus | null>(null);
  readonly lastError = this.errors.lastError;

  async ngOnInit(): Promise<void> {
    this.destroyRef.onDestroy(this.bridge.on('backend:status', (status) => this.backend.set(status)));
    try {
      this.backend.set(await this.bridge.invoke('backend:getStatus', null));
      this.info.set(await this.bridge.invoke('app:getInfo', null));
      this.library.set(await this.bridge.invoke('library:status', null));
      this.system.set(await this.bridge.invoke('system:status', null));
    } catch (error) {
      this.errors.report(error);
    }
  }
}
