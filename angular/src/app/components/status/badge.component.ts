import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'danger';

@Component({
  selector: 'ns-badge',
  template: '{{ text() }}',
  host: {
    class: 'badge',
    '[class.neutral]': "tone() === 'neutral'",
    '[class.danger]': "tone() === 'danger'",
    '[class.dot-only]': 'dotOnly()',
    '[hidden]': 'count() <= 0',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly count = input(0);
  readonly tone = input<BadgeTone>('neutral');
  readonly dotOnly = input(false);
  readonly text = computed(() => (this.dotOnly() ? '' : this.count() > 99 ? '99+' : String(this.count())));
}
