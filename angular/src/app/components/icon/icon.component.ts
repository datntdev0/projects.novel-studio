import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ns-icon',
  template: `<svg focusable="false"><use [attr.href]="'#i-' + name()"></use></svg>`,
  styles: `
    :host {
      display: inline-block;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    class: 'icon',
    '[class.sm]': "size() === 'sm'",
    '[class.lg]': "size() === 'lg'",
    '[class.xl]': "size() === 'xl'",
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<IconSize>('md');
}
