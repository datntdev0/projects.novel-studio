import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'running';

@Component({
  selector: 'ns-pill',
  template: '<ng-content />',
  host: {
    class: 'pill',
    '[class.success]': "tone() === 'success'",
    '[class.warning]': "tone() === 'warning'",
    '[class.danger]': "tone() === 'danger'",
    '[class.info]': "tone() === 'info'",
    '[class.running]': "tone() === 'running'",
    '[class.plain]': 'plain()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillComponent {
  readonly tone = input<PillTone>('neutral');
  readonly plain = input(false);
}
