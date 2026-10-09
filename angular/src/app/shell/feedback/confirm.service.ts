import { Injectable, signal } from '@angular/core';
import type { TranslateParams } from '@shared/core';

export interface ConfirmRequest {
  titleKey: string;
  messageKey: string;
  confirmKey: string;
  params?: TranslateParams;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly current = signal<ConfirmRequest | null>(null);
  private resolve: ((confirmed: boolean) => void) | null = null;

  readonly request = this.current.asReadonly();

  ask(request: ConfirmRequest): Promise<boolean> {
    this.answer(false);
    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
      this.current.set(request);
    });
  }

  answer(confirmed: boolean): void {
    const resolve = this.resolve;
    this.resolve = null;
    this.current.set(null);
    resolve?.(confirmed);
  }
}
