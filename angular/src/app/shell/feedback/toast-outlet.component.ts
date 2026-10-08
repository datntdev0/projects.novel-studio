import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ToastsComponent, type ToastItem } from '../../components/overlay/toasts.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'ns-toast-outlet',
  imports: [ToastsComponent],
  template: `<ns-toasts testId="toast" data-testid="toasts" [toasts]="items()" (dismissed)="toast.dismiss($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutletComponent {
  protected readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  protected readonly items = computed<ToastItem[]>(() =>
    this.toast
      .toasts()
      .map(({ id, request }) => ({
        id,
        tone: request.tone,
        title: this.i18n.t(request.titleKey, request.params),
        body: request.bodyKey ? this.i18n.t(request.bodyKey, request.params) : undefined,
        details: request.details,
      })),
  );
}
