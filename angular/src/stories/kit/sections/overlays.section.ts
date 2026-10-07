import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonDirective } from '../../../app/components/button/button.directive';
import { InputDirective } from '../../../app/components/form/input.directive';
import { ConfirmDialogComponent } from '../../../app/components/overlay/confirm-dialog.component';
import { DialogComponent } from '../../../app/components/overlay/dialog.component';

@Component({
  selector: 'app-kit-overlays',
  imports: [ButtonDirective, InputDirective, DialogComponent, ConfirmDialogComponent],
  template: `
    <h2>Overlays</h2>
    <div class="demo">
      <button nsBtn type="button" data-testid="kit-dialog-open-default" (click)="defaultOpen.set(true)">Default dialog</button>
      <button nsBtn type="button" data-testid="kit-dialog-open-wide" (click)="wideOpen.set(true)">Wide dialog</button>
      <button nsBtn variant="danger" type="button" data-testid="kit-dialog-open-confirm" (click)="confirmOpen.set(true)">
        Confirm dialog
      </button>
    </div>
    <ns-dialog [(open)]="defaultOpen" title="Default dialog" testId="kit-dialog-default">
      <input nsInput data-autofocus aria-label="Name" data-testid="kit-dialog-default-input" />
      <ng-container dialogFoot>
        <button nsBtn type="button" data-testid="kit-dialog-default-cancel" (click)="defaultOpen.set(false)">Cancel</button>
        <button nsBtn variant="primary" type="button" data-testid="kit-dialog-default-ok" (click)="defaultOpen.set(false)">OK</button>
      </ng-container>
    </ns-dialog>
    <ns-dialog [(open)]="wideOpen" title="Wide dialog" [wide]="true" testId="kit-dialog-wide">
      <p>A wide dialog with text only. Its close button is the single focusable element.</p>
    </ns-dialog>
    <ns-confirm-dialog
      [(open)]="confirmOpen"
      title="Discard changes?"
      message="Your edits are not saved and will be lost."
      confirmLabel="Discard changes"
      testId="kit-dialog-confirm"
    />
  `,
  host: { 'data-testid': 'kit-section-overlays' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitOverlaysSection {
  protected readonly defaultOpen = signal(false);
  protected readonly wideOpen = signal(false);
  protected readonly confirmOpen = signal(false);
}
