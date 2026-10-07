import { Directive, booleanAttribute, input } from '@angular/core';

@Directive({
  selector: 'button[nsBtn], a[nsBtn]',
  host: {
    class: 'btn',
    '[class.primary]': "variant() === 'primary'",
    '[class.ghost]': "variant() === 'ghost'",
    '[class.danger]': "variant() === 'danger'",
    '[class.solid]': 'solid()',
    '[class.sm]': "size() === 'sm'",
    '[class.lg]': "size() === 'lg'",
    '[class.icon]': 'iconOnly()',
    '[class.loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? true : null',
  },
})
export class ButtonDirective {
  readonly variant = input<'default' | 'primary' | 'ghost' | 'danger'>('default');
  readonly solid = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
}
