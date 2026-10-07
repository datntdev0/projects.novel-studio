import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ns-error-state',
  imports: [IconComponent, TranslatePipe],
  template: `
    <ns-icon name="alert-circle" size="xl" />
    <h3>{{ message() }}</h3>
    @if (details()) {
      <details class="error-details" [attr.data-testid]="testId() + '-details'">
        <summary>{{ 'ui.details' | t }}</summary>
        <pre class="log">{{ details() }}</pre>
      </details>
    }
  `,
  host: { class: 'empty compact error', role: 'alert' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly message = input<string>('');
  readonly details = input<string>('');
  readonly testId = input<string>('');
}
