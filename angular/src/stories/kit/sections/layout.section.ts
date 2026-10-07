import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-kit-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'kit-section-layout' },
  template: `
    <h2>Layout</h2>
    <h3>Panel</h3>
    <section class="panel" data-testid="kit-panel">
      <div class="panel-head" data-testid="kit-panel-head"><h3>Panel title</h3></div>
      <div class="panel-body" data-testid="kit-panel-body">Panel body content</div>
      <div class="panel-foot" data-testid="kit-panel-foot">Panel footer</div>
    </section>
    <h3>Flush panel body</h3>
    <section class="panel">
      <div class="panel-body flush" data-testid="kit-panel-flush">Flush body without padding</div>
    </section>
    <h3>Row, column, divider and separator</h3>
    <div class="demo col">
      <div class="row" data-testid="kit-row">
        <span>One</span>
        <span class="sep" data-testid="kit-sep"></span>
        <span>Two</span>
      </div>
      <div class="row between" data-testid="kit-row-between">
        <span>Left</span>
        <span>Right</span>
      </div>
      <div class="divider" data-testid="kit-divider"></div>
      <div class="col" data-testid="kit-col">
        <span>First</span>
        <span>Second</span>
      </div>
    </div>
  `,
})
export class KitLayoutSection {}
