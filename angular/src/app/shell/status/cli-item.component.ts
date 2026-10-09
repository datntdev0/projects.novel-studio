import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { CliStatus } from '@shared/core';
import { DotComponent, type DotState } from '../../components/status/dot.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { navCommandId } from '../commands/navigation.commands';

const CLI_LABELS: Record<CliStatus['name'], string> = { claude: 'Claude', codex: 'Codex' };
const CLI_DOTS: Record<CliStatus['state'], DotState> = { ready: 'ok', warning: 'warn', missing: 'bad', unknown: 'neutral' };

@Component({
  selector: 'ns-cli-item',
  imports: [DotComponent],
  template: `
    <button type="button" class="item link" [attr.data-testid]="testId()" [attr.title]="title()" (click)="open()">
      <ns-dot [attr.data-testid]="testId() + '-dot'" [state]="dot()" />
      {{ cli().name }} {{ detail() }}
    </button>
  `,
  styleUrl: './status-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliItemComponent {
  private readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  readonly cli = input.required<CliStatus>();
  protected readonly testId = computed(() => `statusbar-cli-${this.cli().name}`);
  protected readonly dot = computed(() => CLI_DOTS[this.cli().state]);
  protected readonly title = computed(() => this.i18n.t('status.cli.title', { name: CLI_LABELS[this.cli().name] }));
  protected readonly detail = computed(() => {
    const { state, version, problemCode } = this.cli();
    if (state === 'ready') return version ?? '';
    if (state === 'warning') return this.problemText(problemCode);
    return this.i18n.t(`status.cli.${state}`);
  });

  protected open(): void {
    this.commands.run(navCommandId('settings'));
  }

  private problemText(problemCode: string | null): string {
    const key = `status.cli.problem.${problemCode}`;
    const text = this.i18n.t(key);
    return problemCode && text !== key ? text : this.i18n.t('status.cli.warning');
  }
}
