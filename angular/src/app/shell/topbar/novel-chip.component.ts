import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { PaletteService } from '../palette/palette.service';
import { ShellStore } from '../shell.store';

@Component({
  selector: 'ns-novel-chip',
  imports: [IconComponent, TranslatePipe],
  template: `
    @if (novel(); as novel) {
      <span class="novel-chip" data-testid="topbar-novel-chip">
        <button
          type="button"
          class="main"
          data-testid="topbar-novel-switch"
          [title]="novel.title + ' · ' + ('topbar.switchNovel' | t)"
          (click)="openPalette($event)"
        >
          <ns-icon name="book" size="sm" />
          <b>{{ novel.title }}</b>
          <span class="count" data-testid="topbar-novel-count">{{
            'topbar.chapters' | t: { count: i18n.formatNumber(novel.chapterCount) }
          }}</span>
          <ns-icon class="caret" name="chevron-down" size="sm" />
        </button>
        <button
          type="button"
          class="clear"
          data-testid="topbar-novel-clear"
          [attr.aria-label]="'topbar.closeNovel' | t"
          [title]="'topbar.closeNovel' | t"
          (click)="clear()"
        >
          <ns-icon name="x" size="sm" />
        </button>
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex: 0 1 auto;
      min-width: 0;
    }
    .novel-chip {
      display: inline-flex;
      align-items: stretch;
      height: 26px;
      min-width: 0;
      max-width: 440px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-raised);
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      border: 0;
      background: transparent;
      color: var(--color-text-secondary);
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      background: var(--color-surface-muted);
      color: var(--color-text);
    }
    .main {
      gap: 6px;
      min-width: 0;
      padding: 0 6px 0 8px;
    }
    .main > ns-icon {
      flex: none;
      color: var(--color-link);
    }
    .main > .caret {
      color: var(--color-text-tertiary);
    }
    b {
      min-width: 0;
      overflow: hidden;
      color: var(--color-text);
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count {
      flex: none;
      color: var(--color-text-tertiary);
    }
    .clear {
      flex: none;
      justify-content: center;
      width: 24px;
      border-left: 1px solid var(--color-border);
      color: var(--color-text-tertiary);
    }
    @media (max-width: 1439px) {
      .novel-chip {
        max-width: 300px;
      }
      .count {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovelChipComponent {
  private readonly store = inject(ShellStore);
  private readonly palette = inject(PaletteService);
  protected readonly i18n = inject(I18nService);
  protected readonly novel = computed(() => this.store.novels().find((item) => item.id === this.store.openNovel()));

  protected openPalette(event: Event): void {
    this.palette.open('novels', event.currentTarget as Element);
  }

  protected clear(): void {
    this.store.closeNovel();
    this.store.go('library');
  }
}
