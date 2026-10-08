import { Injectable, signal } from '@angular/core';
import type { TranslateParams } from '@shared/core';
import type { ToastTone } from '../../components/overlay/toasts.component';

export const TOAST_TIMEOUT_MS = 5000;
export const TOAST_LIMIT = 3;

export interface ToastRequest {
  tone: ToastTone;
  titleKey: string;
  bodyKey?: string;
  params?: TranslateParams;
  details?: string;
  sticky?: boolean;
}

export interface ToastEntry {
  id: string;
  request: ToastRequest;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly entries = signal<ToastEntry[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;
  readonly toasts = this.entries.asReadonly();

  show(request: ToastRequest): string {
    const id = String(++this.counter);
    const kept = this.entries().slice(0, TOAST_LIMIT - 1);
    this.entries()
      .slice(TOAST_LIMIT - 1)
      .forEach((entry) => this.clearTimer(entry.id));
    this.entries.set([{ id, request }, ...kept]);
    if (request.tone !== 'danger' && !request.sticky) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), TOAST_TIMEOUT_MS),
      );
    }
    return id;
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.entries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  private clearTimer(id: string): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
}
