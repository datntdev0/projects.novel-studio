import { Component, inject, signal } from '@angular/core';
import { nsError } from '@shared/core';
import { BRIDGE } from '../../../app/core/bridge/bridge.token';
import { I18nService } from '../../../app/core/i18n/i18n.service';
import { TranslatePipe } from '../../../app/core/i18n/t.pipe';
import { ConfirmService } from '../../../app/shell/feedback/confirm.service';
import { ToastService } from '../../../app/shell/feedback/toast.service';
import { AreaStateComponent } from '../../../app/shell/feedback/area-state.component';
import { loadArea } from '../../../app/shell/feedback/area-state';
import type { ToastTone } from '../../../app/components/overlay/toasts.component';

@Component({
  selector: 'ns-probe-appearance',
  imports: [TranslatePipe, AreaStateComponent],
  templateUrl: './probe-appearance.component.html',
})
export class ProbeAppearanceComponent {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly bridge = inject(BRIDGE);
  readonly area = loadArea(
    () => this.bridge.invoke('library:listNovels', null),
    (novels) => novels.length === 0,
  );
  readonly i18n = inject(I18nService);
  readonly scrollLines = Array.from({ length: 40 }, (_, index) => index + 1);
  readonly sampleTime = Date.now() - 2 * 60 * 60 * 1000;
  readonly deleteResult = signal<'none' | 'cancelled' | 'confirmed'>('none');

  showToast(tone: ToastTone, name: string, details?: string): void {
    this.toast.show({ tone, titleKey: `dev.probe.${name}Title`, bodyKey: `dev.probe.${name}Body`, details });
  }

  showNsError(): void {
    this.toast.error(nsError('BACKEND_FAILED', 'Backend failed', 'Traceback: uvicorn exited with code 1'));
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
