import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StatusStore } from './status.store';
import { CliItemComponent } from './cli-item.component';
import { JobItemComponent } from './job-item.component';
import { BackendItemComponent } from './backend-item.component';

@Component({
  selector: 'ns-status-bar',
  imports: [CliItemComponent, JobItemComponent, BackendItemComponent],
  template: `
    <footer class="statusbar" data-testid="statusbar">
      @for (cli of status.clis(); track cli.name) {
        <ns-cli-item [cli]="cli" />
      }
      <ns-job-item />
      <ns-backend-item />
      <span class="spacer"></span>
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
    .spacer {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  protected readonly status = inject(StatusStore);
}
