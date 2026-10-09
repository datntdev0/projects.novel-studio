import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShortcutSheetService {
  private readonly open = signal(false);

  readonly visible = this.open.asReadonly();

  private opener: Element | null = null;

  show(): void {
    if (!this.open()) {
      this.opener = document.activeElement;
    }
    this.open.set(true);
  }

  hide(): Element | null {
    const opener = this.open() ? this.opener : null;
    this.open.set(false);
    return opener;
  }
}
