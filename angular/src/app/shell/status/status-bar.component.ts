import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconComponent } from '../../components/icon/icon.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { ThemeService } from '../../core/theme/theme.service';
import { PALETTE_COMMAND_ID, SHORTCUTS_COMMAND_ID, commandKeys } from '../palette/palette-search';
import { KeysComponent } from '../palette/keys.component';
import { ShellStore } from '../shell.store';
import { StatusStore } from './status.store';
import { CliItemComponent } from './cli-item.component';
import { JobItemComponent } from './job-item.component';
import { BackendItemComponent } from './backend-item.component';

@Component({
  selector: 'ns-status-bar',
  imports: [IconComponent, KeysComponent, CliItemComponent, JobItemComponent, BackendItemComponent],
  template: `
    <footer class="statusbar" data-testid="statusbar">
      <span class="item library" data-testid="statusbar-library" [attr.title]="status.library()?.root">
        <ns-icon name="folder" size="sm" />
        <span class="path">{{ status.library()?.root ?? i18n.t('status.noLibrary') }}</span>
      </span>
      @for (cli of status.clis(); track cli.name) {
        <ns-cli-item [cli]="cli" />
      }
      <ns-job-item />
      <ns-backend-item />
      <span class="spacer"></span>
      @if (chapterText(); as text) {
        <span class="item" data-testid="statusbar-chapter">{{ text }}</span>
      }
      <span class="item hint" data-testid="statusbar-hint-palette">
        <ns-keys [chords]="paletteKeys()" compact />
        {{ i18n.t('status.hint.palette') }}
      </span>
      <span class="item hint" data-testid="statusbar-hint-shortcuts">
        <ns-keys [chords]="shortcutsKeys()" compact />
        {{ i18n.t('status.hint.shortcuts') }}
      </span>
      <span class="item" data-testid="statusbar-lang-theme">{{ langTheme() }}</span>
    </footer>
  `,
  styleUrl: './status-item.scss',
  styles: `
    :host {
      grid-area: status;
      min-width: 0;
      display: block;
    }
    .statusbar {
      display: flex;
      align-items: center;
      gap: var(--sp-lg);
      height: 100%;
      padding: 0 var(--sp-md);
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
    }
    .statusbar > ns-cli-item,
    .statusbar > ns-job-item,
    .statusbar > ns-backend-item {
      display: contents;
    }
    .library {
      flex: 0 1 auto;
      min-width: 0;
    }
    .library .path {
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .spacer {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  protected readonly status = inject(StatusStore);
  protected readonly shell = inject(ShellStore);
  protected readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  private readonly theme = inject(ThemeService);
  protected readonly paletteKeys = computed(() => commandKeys(this.commands.commands(), PALETTE_COMMAND_ID).slice(0, 1));
  protected readonly shortcutsKeys = computed(() => commandKeys(this.commands.commands(), SHORTCUTS_COMMAND_ID).slice(0, 1));
  protected readonly chapterText = computed(() => {
    const chapter = this.shell.openChapter();
    if (!this.shell.openNovel() || !chapter) return null;
    return this.i18n.t('status.chapter', { number: String(chapter.number).padStart(4, '0'), chars: chapter.charCount });
  });
  protected readonly langTheme = computed(
    () => `${this.i18n.language().toUpperCase()} · ${this.i18n.t(`status.theme.${this.theme.theme()}`)}`,
  );
}
