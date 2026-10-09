import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ns-keys',
  template: `@for (chord of chords(); track chord; let last = $last) {
    <span class="keys">
      @for (part of chord.split('+'); track $index) {
        <kbd>{{ part }}</kbd>
      }
    </span>
    @if (!last) {
      <span> · </span>
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeysComponent {
  readonly chords = input.required<string[]>();
}
