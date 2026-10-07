import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DotState = 'neutral' | 'ok' | 'warn' | 'bad' | 'run';

@Component({
  selector: 'ns-dot',
  template: '',
  host: {
    class: 'dot',
    '[class.ok]': "state() === 'ok'",
    '[class.warn]': "state() === 'warn'",
    '[class.bad]': "state() === 'bad'",
    '[class.run]': "state() === 'run'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotComponent {
  readonly state = input<DotState>('neutral');
}
