import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { EmptyStateComponent } from '../../../ui/state/empty-state.component';
import { ErrorStateComponent } from '../../../ui/state/error-state.component';
import { LoadingStateComponent } from '../../../ui/state/loading-state.component';

@Component({
  selector: 'app-kit-states',
  imports: [EmptyStateComponent, LoadingStateComponent, ErrorStateComponent, ButtonDirective],
  template: `
    <h2>States</h2>
    <h3>Empty</h3>
    <div class="demo">
      <ns-empty-state
        icon="library"
        title="No novels yet"
        text="Import a novel from a ZIP package to get started."
        data-testid="kit-empty-full"
      >
        <button nsBtn variant="primary" type="button" data-testid="kit-empty-full-action">Import novel</button>
      </ns-empty-state>
      <ns-empty-state [compact]="true" icon="tasks" title="No running tasks" data-testid="kit-empty-compact" />
    </div>
    <h3>Loading</h3>
    <div class="demo">
      <ns-loading-state label="Loading library information" data-testid="kit-loading" />
    </div>
    <h3>Error</h3>
    <div class="demo">
      <ns-error-state
        message="Could not read the library information"
        details="SqliteError: SQLITE_BUSY: database is locked (library.sqlite)"
        testId="kit-error"
        data-testid="kit-error"
      />
    </div>
  `,
  host: { 'data-testid': 'kit-section-states' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitStatesSection {}
