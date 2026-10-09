import { Injectable, computed, inject } from '@angular/core';
import { SettingsService } from '../../core/settings/settings.service';

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly settings = inject(SettingsService);
  readonly railExpanded = computed(() => this.settings.settings().railExpanded);

  toggleRail(): Promise<void> {
    return this.settings.update({ railExpanded: !this.railExpanded() });
  }
}
