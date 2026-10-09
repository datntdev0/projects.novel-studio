import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { findEntry } from '../registry/module-registry';
import { ShellStore } from '../shell.store';
import { NovelChipComponent } from './novel-chip.component';

@Component({
  selector: 'ns-crumbs',
  imports: [NovelChipComponent, TranslatePipe],
  template: `
    <nav class="crumbs" data-testid="topbar-crumbs" [attr.aria-label]="'topbar.context' | t">
      <b data-testid="topbar-crumb-module">{{ labelKey() | t }}</b>
      @if (hasNovel()) {
        <span class="sep">·</span>
        <ns-novel-chip />
      }
    </nav>
  `,
  styles: `
    :host {
      display: flex;
      min-width: 0;
    }
    .crumbs {
      display: flex;
      align-items: center;
      flex: 0 1 auto;
      gap: var(--sp-xs);
      min-width: 0;
      margin-left: var(--sp-lg);
      color: var(--color-text-secondary);
      font-size: 12px;
    }
    .sep {
      flex: none;
      color: var(--color-text-tertiary);
    }
    b {
      flex: none;
      color: var(--color-text);
      font-weight: 500;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrumbsComponent {
  protected readonly store = inject(ShellStore);
  protected readonly hasNovel = computed(() => this.store.novels().some((item) => item.id === this.store.openNovel()));
  protected readonly labelKey = computed(() => findEntry(this.store.activeModule())?.labelKey ?? '');
}
