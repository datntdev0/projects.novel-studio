import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { ButtonDirective } from '../button/button.directive';
import { IconComponent } from '../icon/icon.component';
import { DialogComponent } from './dialog.component';

@Component({
  selector: 'ns-confirm-dialog',
  imports: [DialogComponent, ButtonDirective, IconComponent, TranslatePipe],
  template: `
    <ns-dialog [(open)]="open" [title]="title()" [testId]="testId()" (closed)="cancelled.emit()">
      @if (danger()) {
        <ns-icon dialogIcon class="danger" size="lg" name="alert-triangle" />
      }
      <p>{{ message() }}</p>
      <ng-container dialogFoot>
        <button nsBtn type="button" data-autofocus [attr.data-testid]="testId() + '-cancel'" (click)="cancel()">
          {{ 'ui.cancel' | t }}
        </button>
        <button
          nsBtn
          type="button"
          [variant]="danger() ? 'danger' : 'primary'"
          [solid]="danger()"
          [attr.data-testid]="testId() + '-confirm'"
          (click)="confirm()"
        >
          {{ confirmLabel() }}
        </button>
      </ng-container>
    </ns-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = model<boolean>(false);
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('');
  readonly danger = input<boolean>(true);
  readonly testId = input<string>('');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  protected confirm(): void {
    this.open.set(false);
    this.confirmed.emit();
  }
}
