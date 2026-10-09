import { Component, inject } from '@angular/core';
import { nsError, type BackendState } from '@shared/core';
import { BRIDGE } from '../../../app/core/bridge/bridge.token';
import { BrowserBridge } from '../../../app/core/bridge/browser-bridge';
import { StatusStore } from '../../../app/shell/status/status.store';
import { ShellStore } from '../../../app/shell/shell.store';

@Component({ selector: 'ns-probe-status', templateUrl: './probe-status.component.html' })
export class ProbeStatusComponent {
  private readonly bridge = inject(BRIDGE);
  private readonly browser = this.bridge instanceof BrowserBridge ? this.bridge : null;
  protected readonly status = inject(StatusStore);
  private readonly shell = inject(ShellStore);

  protected clearAttention(): void {
    for (const job of this.status.jobs().filter((item) => item.needsAttention))
      this.browser?.emit('job:progress', { ...job, needsAttention: false });
  }

  protected finishJob(): void {
    const job = this.status.runningJob();
    if (job) this.browser?.emit('job:progress', { ...job, state: 'completed', current: null });
  }

  protected openChapter(): void {
    this.shell.setOpenChapter({ number: 12, charCount: 3208 });
  }

  protected setBackend(state: BackendState): void {
    const error = state === 'failed' ? nsError('BACKEND_FAILED', 'Backend failed', 'python exited with code 1 (probe)') : null;
    this.browser?.emit('backend:status', { state, port: null, pid: null, restarts: 0, error });
  }
}
