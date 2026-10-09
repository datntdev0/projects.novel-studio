import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { NsError } from '@shared/core';
import { ErrorStateComponent } from '../../components/state/error-state.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { errorDetails, errorKey } from './error-text';

@Component({
  selector: 'ns-error-message',
  imports: [ErrorStateComponent],
  template: `<ns-error-state [message]="message()" [details]="details()" [testId]="testId()" />`,
  host: { '[attr.data-testid]': 'testId()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorMessageComponent {
  private readonly i18n = inject(I18nService);
  readonly error = input.required<NsError>();
  readonly testId = input<string>('');
  protected readonly message = computed(() => this.i18n.t(errorKey(this.error())));
  protected readonly details = computed(() => errorDetails(this.error()));
}
