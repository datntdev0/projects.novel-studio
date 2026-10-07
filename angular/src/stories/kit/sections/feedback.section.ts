import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CalloutComponent } from '../../../app/components/status/callout.component';
import { ProgressComponent } from '../../../app/components/status/progress.component';

@Component({
  selector: 'app-kit-feedback',
  styleUrls: ['../kit-section.css'],
  imports: [CalloutComponent, ProgressComponent],
  template: `
    <h2>Feedback</h2>
    <h3>Callouts</h3>
    <div class="demo col">
      <ns-callout tone="info" data-testid="kit-callout-info">Info callout, neutral guidance.</ns-callout>
      <ns-callout tone="warning" title="Needs re-check" data-testid="kit-callout-warning"
        >Saving marks the translation as needing a re-check.</ns-callout
      >
      <ns-callout tone="success" data-testid="kit-callout-success">Success callout, the library folder is ready.</ns-callout>
      <ns-callout tone="danger" data-testid="kit-callout-danger">Danger callout, this cannot be undone.</ns-callout>
    </div>
    <h3>Progress</h3>
    <div class="demo col">
      <ns-progress [value]="37" [failed]="3" label="Determinate with failures" data-testid="kit-progress-determinate" />
      <ns-progress [value]="68" [failed]="3" label="Failed segment" data-testid="kit-progress-failed" />
      <ns-progress [value]="68" [paused]="true" label="Paused" data-testid="kit-progress-paused" />
      <ns-progress [indeterminate]="true" label="Indeterminate" data-testid="kit-progress-indeterminate" />
      <ns-progress [value]="68" size="lg" label="Large" data-testid="kit-progress-lg" />
      <div class="progress-row">
        <span>Translate 0001-0100</span>
        <span class="num">37/100</span>
        <ns-progress [value]="37" label="Translate 0001-0100" data-testid="kit-progress-row" />
      </div>
    </div>
  `,
  host: { 'data-testid': 'kit-section-feedback' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitFeedbackSection {}
