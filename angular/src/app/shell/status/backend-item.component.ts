import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DotComponent } from '../../components/status/dot.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { errorDetails, errorKey, toNsError } from '../feedback/error-text';
import { StatusStore } from './status.store';

@Component({
  selector: 'ns-backend-item',
  imports: [DotComponent],
  template: `
    @if (view(); as view) {
      <span class="item" data-testid="statusbar-backend" [attr.title]="view.title">
        <ns-dot data-testid="statusbar-backend-dot" [state]="view.dot" />
        {{ view.text }}
      </span>
    }
  `,
  styleUrl: './status-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendItemComponent {
  private readonly i18n = inject(I18nService);
  private readonly status = inject(StatusStore);
  protected readonly view = computed(() => {
    const backend = this.status.backend();
    if (backend?.state === 'starting' || backend?.state === 'restarting') {
      return { dot: 'run' as const, text: this.i18n.t('status.backend.starting'), title: null };
    }
    if (backend?.state === 'failed') {
      const error = backend.error ?? toNsError(null);
      return {
        dot: 'warn' as const,
        text: this.i18n.t('status.backend.failed', { reason: this.i18n.t(errorKey(error)) }),
        title: errorDetails(error),
      };
    }
    return null;
  });
}
