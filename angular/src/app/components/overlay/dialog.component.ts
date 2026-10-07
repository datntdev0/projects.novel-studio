import { ChangeDetectionStrategy, Component, Injector, afterNextRender, booleanAttribute, effect, inject, input, model, output, viewChild, ElementRef } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { ButtonDirective } from '../button/button.directive';
import { IconComponent } from '../icon/icon.component';
import { focusableElements, trapTab } from './focus-trap';

let nextId = 0;

@Component({
  selector: 'ns-dialog',
  imports: [TranslatePipe, ButtonDirective, IconComponent],
  template: `
    @if (open()) {
      <div class="scrim open" [attr.data-testid]="testId() ? testId() + '-scrim' : null" (click)="onScrimClick($event)">
        <div
          #dialog
          class="dialog"
          [class.wide]="wide()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.data-testid]="testId() || null"
        >
          <div class="dialog-head">
            <ng-content select="[dialogIcon]" />
            <h2 [id]="titleId">{{ title() }}</h2>
            <button
              nsBtn
              variant="ghost"
              iconOnly
              type="button"
              [attr.aria-label]="'ui.close' | t"
              [attr.data-testid]="testId() ? testId() + '-close' : null"
              (click)="close()"
            >
              <ns-icon name="x" />
            </button>
          </div>
          <div class="dialog-body"><ng-content /></div>
          <div class="dialog-foot"><ng-content select="[dialogFoot]" /></div>
        </div>
      </div>
    }
  `,
  host: { '(document:keydown)': 'onKeydown($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private opener: HTMLElement | null = null;

  readonly open = model<boolean>(false);
  readonly title = input<string>('');
  readonly wide = input(false, { transform: booleanAttribute });
  readonly testId = input<string>('');
  readonly closed = output<void>();
  protected readonly titleId = `ns-dialog-title-${nextId++}`;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.opener = document.activeElement as HTMLElement | null;
        afterNextRender(() => this.focusInitial(), { injector: this.injector });
      } else {
        this.opener?.focus();
        this.opener = null;
      }
    });
  }

  protected close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  protected onScrimClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const container = this.dialog()?.nativeElement;
    if (!this.open() || !container) {
      return;
    }
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Tab') {
      trapTab(event, container);
    }
  }

  private focusInitial(): void {
    const container = this.dialog()?.nativeElement;
    if (!container) {
      return;
    }
    const target = container.querySelector<HTMLElement>('[data-autofocus]') ?? focusableElements(container)[0];
    target?.focus();
  }
}
