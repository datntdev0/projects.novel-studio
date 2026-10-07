import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BadgeComponent } from '../../../app/components/status/badge.component';
import { DotComponent } from '../../../app/components/status/dot.component';
import { PillComponent } from '../../../app/components/status/pill.component';

@Component({
  selector: 'app-kit-status',
  styleUrls: ['../kit-section.css'],
  imports: [PillComponent, BadgeComponent, DotComponent],
  template: `
    <h2>Status</h2>
    <h3>Pills</h3>
    <div class="demo">
      <ns-pill tone="neutral" data-testid="kit-pill-neutral">Neutral</ns-pill>
      <ns-pill tone="success" data-testid="kit-pill-success">Success</ns-pill>
      <ns-pill tone="warning" data-testid="kit-pill-warning">Warning</ns-pill>
      <ns-pill tone="danger" data-testid="kit-pill-danger">Danger</ns-pill>
      <ns-pill tone="info" data-testid="kit-pill-info">Info</ns-pill>
      <ns-pill tone="running" data-testid="kit-pill-running">Running</ns-pill>
      <ns-pill [plain]="true" data-testid="kit-pill-plain">Plain</ns-pill>
    </div>
    <h3>Badges</h3>
    <div class="demo">
      <ns-badge [count]="0" data-testid="kit-badge-0" />
      <ns-badge [count]="7" tone="danger" data-testid="kit-badge-7" />
      <ns-badge [count]="120" data-testid="kit-badge-120" />
      <ns-badge [count]="1" [dotOnly]="true" tone="danger" data-testid="kit-badge-dot" />
    </div>
    <h3>Dots</h3>
    <div class="demo">
      <span class="row"><ns-dot state="neutral" data-testid="kit-dot-neutral" />neutral</span>
      <span class="row"><ns-dot state="ok" data-testid="kit-dot-ok" />ok</span>
      <span class="row"><ns-dot state="warn" data-testid="kit-dot-warn" />warn</span>
      <span class="row"><ns-dot state="bad" data-testid="kit-dot-bad" />bad</span>
      <span class="row"><ns-dot state="run" data-testid="kit-dot-run" />run</span>
    </div>
    <h3>Keyboard</h3>
    <div class="demo">
      <span data-testid="kit-kbd"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>T</kbd></span>
    </div>
  `,
  styles: `
    .row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  `,
  host: { 'data-testid': 'kit-section-status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitStatusSection {}
