import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

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
  styles: `
    :host(.compact) kbd {
      font-size: 10px;
      line-height: 13px;
      padding: 0 4px;
      min-width: 16px;
    }
  `,
  host: { '[class.compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeysComponent {
  readonly chords = input.required<string[]>();
  readonly compact = input(false, { transform: booleanAttribute });
}
