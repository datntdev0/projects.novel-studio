import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressComponent } from '../../components/status/progress.component';
import { StatusStore } from '../status/status.store';
import { LayoutStore } from './layout.store';

@Component({
  selector: 'ns-focus-bar',
  imports: [ProgressComponent],
  template: `
    @if (layout.focusMode() && status.runningJob()) {
      <ns-progress class="zen-progress" data-testid="zen-progress" [value]="status.runningPercent()" />
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0 0 auto 0;
      height: 2px;
      z-index: 40;
      pointer-events: none;
    }
    .zen-progress {
      display: block;
      width: auto;
      height: 2px;
      border-radius: 0;
      background: transparent;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusBarComponent {
  protected readonly layout = inject(LayoutStore);
  protected readonly status = inject(StatusStore);
}
