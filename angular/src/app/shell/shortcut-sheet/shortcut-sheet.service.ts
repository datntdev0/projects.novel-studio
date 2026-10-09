import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShortcutSheetService {
  private readonly open = signal(false);

  readonly visible = this.open.asReadonly();

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
