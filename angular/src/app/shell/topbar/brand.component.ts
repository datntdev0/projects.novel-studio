import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { LayoutStore } from '../layout/layout.store';

@Component({
  selector: 'ns-brand',
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="brand"
      data-testid="topbar-brand"
      [attr.aria-pressed]="layout.railExpanded()"
      [title]="'topbar.toggleRail' | t"
      (click)="layout.toggleRail()"
    >
      <img class="mark mark-dark" src="brand/novel-studio-mark-dark.svg" alt="" data-testid="topbar-brand-mark-dark" />
      <img class="mark mark-light" src="brand/novel-studio-mark-light.svg" alt="" data-testid="topbar-brand-mark-light" />
      <span>Novel Studio</span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex: none;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--sp-sm);
      height: 28px;
      margin-left: calc(-1 * var(--sp-xs));
      padding: 0 var(--sp-xs);
      border: 0;
      border-radius: var(--radius-sm);
      background: none;
      color: var(--color-text);
      font: inherit;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: -0.1px;
      cursor: pointer;
    }
    .brand:hover {
      background: var(--color-surface-muted);
    }
    .mark {
      width: 22px;
      height: 22px;
      flex: none;
    }
    :host-context(html[data-theme='dark']) .mark-light,
    :host-context(html[data-theme='light']) .mark-dark {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandComponent {
  protected readonly layout = inject(LayoutStore);
}
