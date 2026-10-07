import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressComponent } from '../status/progress.component';

@Component({
  selector: 'ns-loading-state',
  imports: [ProgressComponent],
  template: `
    <ns-progress [indeterminate]="true" [label]="label()" />
    <p>{{ label() }}</p>
  `,
  host: { class: 'empty compact', role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  readonly label = input<string>('');
}
