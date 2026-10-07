import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
  iconOnly?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'ns-segmented',
  imports: [IconComponent],
  template: `
    @for (option of options(); track option.value) {
      <button
        type="button"
        [attr.aria-pressed]="value() === option.value"
        [attr.aria-label]="option.iconOnly ? option.label : null"
        [attr.data-testid]="testId() ? testId() + '-' + option.value : null"
        [disabled]="disabled() || option.disabled"
        (click)="value.set(option.value)"
      >
        @if (option.icon) {
          <ns-icon [name]="option.icon" />
        }
        @if (!option.iconOnly) {
          {{ option.label }}
        }
      </button>
    }
  `,
  host: { class: 'segmented', role: 'group', '[attr.aria-label]': 'ariaLabel() || null' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedComponent {
  readonly options = input.required<SegmentedOption[]>();
  readonly value = model<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>('');
  readonly testId = input<string>('');
}
