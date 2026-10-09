import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { EmptyStateComponent } from '../../components/state/empty-state.component';
import { LoadingStateComponent } from '../../components/state/loading-state.component';
import { ErrorMessageComponent } from './error-message.component';
import type { AreaState } from './area-state';

@Component({
  selector: 'ns-area-state',
  imports: [LoadingStateComponent, EmptyStateComponent, ErrorMessageComponent],
  template: `
    @switch (state().status) {
      @case ('loading') {
        <ns-loading-state [attr.data-testid]="testId() + '-loading'" [label]="loadingLabel()" />
      }
      @case ('empty') {
        <ns-empty-state
          [attr.data-testid]="testId() + '-empty'"
          [compact]="true"
          [icon]="emptyIcon()"
          [title]="emptyTitle()"
          [text]="emptyText()"
        >
          <ng-content />
        </ns-empty-state>
      }
      @case ('error') {
        @if (state().error; as error) {
          <ns-error-message [error]="error" [testId]="testId() + '-error'" />
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaStateComponent {
  private readonly i18n = inject(I18nService);
  readonly state = input.required<AreaState<unknown>>();
  readonly testId = input<string>('');
  readonly loadingKey = input<string>('ui.loading');
  readonly emptyTitleKey = input<string>('');
  readonly emptyTextKey = input<string>('');
  readonly emptyIcon = input<string>('');
  protected readonly loadingLabel = computed(() => this.i18n.t(this.loadingKey()));
  protected readonly emptyTitle = computed(() => this.translateOrEmpty(this.emptyTitleKey()));
  protected readonly emptyText = computed(() => this.translateOrEmpty(this.emptyTextKey()));

  private translateOrEmpty(key: string): string {
    return key ? this.i18n.t(key) : '';
  }
}
