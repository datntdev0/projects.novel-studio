import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_SETTINGS, type AppSettings, type SettingsPatch } from '@shared/core';
import { BRIDGE } from '../bridge/bridge.token';
import { ErrorService } from '../errors/error.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  private readonly current = signal<AppSettings>(DEFAULT_SETTINGS);
  private readonly isLoaded = signal(false);
  readonly settings = this.current.asReadonly();
  readonly loaded = this.isLoaded.asReadonly();

  async load(): Promise<void> {
    await this.apply(() => this.bridge.invoke('settings:get', null));
    this.isLoaded.set(true);
  }

  update(patch: SettingsPatch): Promise<void> {
    return this.apply(() => this.bridge.invoke('settings:set', patch));
  }

  private async apply(request: () => Promise<AppSettings>): Promise<void> {
    try {
      this.current.set(await request());
    } catch (error) {
      this.errors.report(error);
    }
  }
}
