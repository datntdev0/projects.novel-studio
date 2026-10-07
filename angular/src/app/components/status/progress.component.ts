import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ns-progress',
  template: `
    <i [style.--p]="value() + '%'"></i>
    @if (failed() > 0) {
      <i class="fail" [style.--p]="value() + '%'" [style.--f]="failed() + '%'"></i>
    }
  `,
  host: {
    class: 'progress',
    '[class.lg]': "size() === 'lg'",
    '[class.paused]': 'paused()',
    '[class.indeterminate]': 'indeterminate()',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '[attr.aria-label]': 'label() || null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  readonly value = input<number>(0);
  readonly failed = input<number>(0);
  readonly indeterminate = input<boolean>(false);
  readonly paused = input<boolean>(false);
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input<string>('');
  readonly ariaValueNow = computed(() => (this.indeterminate() ? null : this.value()));
}
