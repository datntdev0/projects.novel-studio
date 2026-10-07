import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { FieldComponent } from './field.component';

@Directive({
  selector: 'input[nsInput], textarea[nsInput], select[nsInput]',
  host: {
    '[class]': 'tag',
    '[class.mono]': 'mono()',
    '[attr.aria-invalid]': 'invalid() || field?.error() ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy()',
  },
})
export class InputDirective {
  protected readonly field = inject(FieldComponent, { optional: true });
  protected readonly tag = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName.toLowerCase();
  readonly mono = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
}
