import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConfirmDialogComponent } from '../../components/overlay/confirm-dialog.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'ns-confirm-outlet',
  imports: [ConfirmDialogComponent],
  template: `
    <ns-confirm-dialog
      testId="dlg-confirm"
      [open]="view().open"
      [title]="view().title"
      [message]="view().message"
      [confirmLabel]="view().confirmLabel"
      [danger]="view().danger"
      (confirmed)="confirm.answer(true)"
      (cancelled)="confirm.answer(false)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmOutletComponent {
  private readonly i18n = inject(I18nService);
  protected readonly confirm = inject(ConfirmService);

  protected readonly view = computed(() => {
    const request = this.confirm.request();
    return {
      open: request !== null,
      title: request ? this.i18n.t(request.titleKey, request.params) : '',
      message: request ? this.i18n.t(request.messageKey, request.params) : '',
      confirmLabel: request ? this.i18n.t(request.confirmKey, request.params) : '',
      danger: request?.danger ?? true,
    };
  });
}
