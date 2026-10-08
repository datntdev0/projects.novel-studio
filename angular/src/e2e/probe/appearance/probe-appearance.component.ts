import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../app/core/i18n/t.pipe';
import { ConfirmService } from '../../../app/shell/feedback/confirm.service';
import { ToastService } from '../../../app/shell/feedback/toast.service';
import type { ToastTone } from '../../../app/components/overlay/toasts.component';

@Component({ selector: 'ns-probe-appearance', imports: [TranslatePipe], templateUrl: './probe-appearance.component.html' })
export class ProbeAppearanceComponent {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly deleteResult = signal<'none' | 'cancelled' | 'confirmed'>('none');

  showToast(tone: ToastTone, name: string, details?: string): void {
    this.toast.show({ tone, titleKey: `dev.probe.${name}Title`, bodyKey: `dev.probe.${name}Body`, details });
  }

  async deleteChapter(): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'dev.probe.deleteTitle',
      messageKey: 'dev.probe.deleteMessage',
      confirmKey: 'dev.probe.deleteConfirm',
      params: { name: 'Chapter 0012' },
      danger: true,
    });
    this.deleteResult.set(confirmed ? 'confirmed' : 'cancelled');
  }
}
