import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type CalloutTone = 'info' | 'warning' | 'success' | 'danger';

const TONE_ICONS: Record<CalloutTone, string> = { info: 'info', warning: 'alert-triangle', success: 'check', danger: 'alert-circle' };

@Component({
  selector: 'ns-callout',
  imports: [IconComponent],
  template: `
    <ns-icon [name]="icon()" />
    <div>
      @if (title()) {
        <b>{{ title() }}</b>
      }
      <ng-content />
    </div>
  `,
  host: {
    class: 'callout',
    '[class.info]': "tone() === 'info'",
    '[class.warning]': "tone() === 'warning'",
    '[class.success]': "tone() === 'success'",
    '[class.danger]': "tone() === 'danger'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalloutComponent {
  readonly tone = input<CalloutTone>('info');
  readonly title = input<string>('');
  readonly icon = computed(() => TONE_ICONS[this.tone()]);
}
