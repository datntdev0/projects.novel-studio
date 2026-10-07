import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'ns-field',
  template: `
    <label [attr.for]="for() || null"
      >{{ label() }}
      @if (required()) {
        <span class="req" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (error()) {
      <small class="error-text" [id]="for() + '-error'">{{ error() }}</small>
    } @else if (hint()) {
      <small [id]="for() + '-hint'">{{ hint() }}</small>
    }
  `,
  host: { class: 'field', '[class.error]': '!!error()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent {
  readonly label = input('');
  readonly for = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });

  describedBy(): string | null {
    if (this.error()) return this.for() + '-error';
    return this.hint() ? this.for() + '-hint' : null;
  }
}
