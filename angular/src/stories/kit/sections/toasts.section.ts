import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonDirective } from '../../../app/components/button/button.directive';
import { ToastItem, ToastsComponent } from '../../../app/components/overlay/toasts.component';

@Component({
  selector: 'app-kit-toasts',
  styleUrls: ['../kit-section.css'],
  imports: [ButtonDirective, ToastsComponent],
  template: `
    <h2>Toasts</h2>
    <div class="demo col">
      <div><button nsBtn type="button" data-testid="kit-toast-show" (click)="show()">Show toast</button></div>
      <ns-toasts
        class="static"
        [toasts]="toasts()"
        testId="kit-toasts"
        (dismissed)="dismiss($event)"
        (actioned)="dismiss($event)"
        data-testid="kit-toasts"
      />
    </div>
  `,
  styles: `
    .static {
      position: static;
    }
  `,
  host: { 'data-testid': 'kit-section-toasts' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitToastsSection {
  private count = 0;
  readonly toasts = signal<ToastItem[]>([
    { id: 'info', tone: 'info', title: 'Info toast', body: 'Neutral message.' },
    { id: 'success', tone: 'success', title: 'Saved', body: 'Chapter 12 saved.' },
    { id: 'warning', tone: 'warning', title: 'Job finished with errors', body: '1 item failed.', action: 'Open job' },
    {
      id: 'danger',
      tone: 'danger',
      title: 'Job stopped early',
      body: 'The backend is not logged in.',
      details: 'codex exec: error: not logged in',
    },
  ]);

  show(): void {
    this.count += 1;
    const toast: ToastItem = { id: `new-${this.count}`, tone: 'info', title: `New toast ${this.count}` };
    this.toasts.update((list) => [...list, toast]);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
