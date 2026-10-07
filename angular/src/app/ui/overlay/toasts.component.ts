import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { ButtonDirective } from '../button/button.directive';
import { IconComponent } from '../icon/icon.component';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  details?: string;
  action?: string;
}

export const TOAST_ICONS: Record<ToastTone, string> = { info: 'info', success: 'check', warning: 'alert-triangle', danger: 'alert-circle' };

@Component({
  selector: 'ns-toasts',
  imports: [IconComponent, ButtonDirective, TranslatePipe],
  template: `
    @for (toast of toasts(); track toast.id) {
      <div class="toast" [class]="toast.tone" [attr.data-testid]="testId() + '-' + toast.id">
        <ns-icon [name]="icons[toast.tone]" />
        <div class="body">
          <b>{{ toast.title }}</b>
          @if (toast.body) {
            <span>{{ toast.body }}</span>
          }
          @if (toast.details) {
            <details class="error-details" [attr.data-testid]="testId() + '-' + toast.id + '-details'">
              <summary>{{ 'ui.details' | t }}</summary>
              <pre class="log">{{ toast.details }}</pre>
            </details>
          }
          @if (toast.action) {
            <div class="toast-actions">
              <button
                nsBtn
                variant="ghost"
                size="sm"
                type="button"
                [attr.data-testid]="testId() + '-' + toast.id + '-action'"
                (click)="actioned.emit(toast.id)"
              >
                {{ toast.action }}
              </button>
            </div>
          }
        </div>
        <button
          nsBtn
          variant="ghost"
          [iconOnly]="true"
          type="button"
          [attr.aria-label]="'ui.close' | t"
          [attr.data-testid]="testId() + '-' + toast.id + '-close'"
          (click)="dismissed.emit(toast.id)"
        >
          <ns-icon name="x" />
        </button>
      </div>
    }
  `,
  host: { class: 'toasts', 'aria-live': 'polite' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastsComponent {
  readonly toasts = input<ToastItem[]>([]);
  readonly testId = input<string>('');
  readonly dismissed = output<string>();
  readonly actioned = output<string>();
  readonly icons = TOAST_ICONS;
}
