import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ns-empty-state',
  imports: [IconComponent],
  template: `
    @if (icon()) {
      <ns-icon [name]="icon()" size="xl" />
    }
    <h2>{{ title() }}</h2>
    @if (text()) {
      <p>{{ text() }}</p>
    }
    <div class="row"><ng-content /></div>
  `,
  host: { class: 'empty', '[class.compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('');
  readonly title = input<string>('');
  readonly text = input<string>('');
  readonly compact = input<boolean>(false);
}
