import { Injectable, inject, signal } from '@angular/core';
import { isNsError, type NsError } from '@shared/core';
import { toNsError } from '../../shell/feedback/error-text';
import { BRIDGE } from '../bridge/bridge.token';
import { writeLog } from './write-log';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly bridge = inject(BRIDGE);
  private readonly last = signal<NsError | null>(null);
  readonly lastError = this.last.asReadonly();

  report(error: unknown): void {
    const normalized = toNsError(error);
    const detail = this.detailOf(error, normalized);
    writeLog(this.bridge, { level: 'error', message: normalized.message, detail });
    this.last.set(normalized);
  }

  private detailOf(error: unknown, normalized: NsError): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return isNsError(error) ? normalized.detail : String(error);
  }
}
