import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DotComponent, type DotState } from '../../components/status/dot.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { CommandService } from '../../core/shortcuts/command.service';
import { navCommandId } from '../commands/navigation.commands';
import { commandKeys } from '../palette/palette-search';
import { StatusStore } from './status.store';

@Component({
  selector: 'ns-job-item',
  imports: [DotComponent],
  template: `
    <button type="button" class="item link" data-testid="statusbar-job" [attr.title]="title()" (click)="open()">
      <ns-dot [state]="dotState()" data-testid="statusbar-job-dot" />
      <span data-testid="statusbar-job-text">{{ text() }}</span>
      @if (store.attentionCount() > 0) {
        <span data-testid="statusbar-job-attention"> · {{ i18n.t('status.job.attention', { count: store.attentionCount() }) }}</span>
      }
    </button>
  `,
  styleUrl: './status-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobItemComponent {
  private readonly store = inject(StatusStore);
  private readonly i18n = inject(I18nService);
  private readonly commands = inject(CommandService);
  private readonly tasksId = navCommandId('tasks');
  protected readonly dotState = computed<DotState>(() =>
    this.store.attentionCount() > 0 ? 'warn' : this.store.runningJob() ? 'run' : 'neutral',
  );
  protected readonly attention = computed(() => {
    const count = this.store.attentionCount();
    return count > 0 ? this.i18n.t('status.job.attention', { count }) : '';
  });
  protected readonly title = computed(
    () => `${this.i18n.t('module.tasks.label')} · ${commandKeys(this.commands.commands(), this.tasksId).join(', ')}`,
  );
  protected readonly text = computed(() => {
    const job = this.store.runningJob();
    if (!job) return this.i18n.t('status.job.idle');
    const percent = job.totalCount ? Math.round((job.completedCount * 100) / job.totalCount) : 0;
    return this.i18n.t('status.job.progress', {
      label: this.i18n.t(job.labelKey),
      done: job.completedCount,
      total: job.totalCount,
      percent,
    });
  });

  protected open(): void {
    this.commands.run(this.tasksId);
  }
}
