import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyStateComponent } from '../../components/state/empty-state.component';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { ModuleEntry } from '../registry/module-registry';

@Component({
  selector: 'ns-module-empty',
  imports: [EmptyStateComponent, TranslatePipe],
  template: `
    <div class="ws-toolbar">
      <h2 data-testid="module-empty-title">{{ entry().labelKey | t }}</h2>
    </div>
    <div class="ws-body center">
      <ns-empty-state
        data-testid="module-empty-description"
        [icon]="entry().icon"
        [title]="entry().labelKey | t"
        [text]="entry().descriptionKey | t"
      />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .ws-toolbar {
      display: flex;
      align-items: center;
      gap: var(--sp-sm);
      height: 40px;
      padding: 0 var(--sp-md);
      border-bottom: 1px solid var(--color-border);
      flex: none;
    }
    .ws-toolbar h2 {
      font-size: 14px;
      font-weight: 600;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: none;
      max-width: 40%;
    }
    .ws-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: var(--sp-lg);
    }
    .ws-body.center {
      display: grid;
      place-items: center;
    }
  `,
  host: { 'data-testid': 'module-empty' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleEmptyComponent {
  readonly entry = input.required<ModuleEntry>();
}
