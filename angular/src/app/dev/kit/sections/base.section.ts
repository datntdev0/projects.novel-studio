import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { IconComponent } from '../../../ui/icon/icon.component';

const COLOR_TOKENS = [
  'primary',
  'background',
  'surface',
  'surface-raised',
  'surface-muted',
  'text',
  'text-secondary',
  'text-tertiary',
  'border',
  'border-strong',
  'link',
  'focus',
  'success',
  'warning',
  'danger',
  'code-background',
];

@Component({
  selector: 'app-kit-base',
  imports: [IconComponent],
  template: `
    <h2>Base</h2>
    <h3>Semantic colours</h3>
    <div class="swatches" data-testid="kit-base-colors">
      @for (token of colorTokens; track token) {
        <div class="swatch">
          <i [style.background]="'var(--color-' + token + ')'"></i>
          <div>
            {{ token }}<code>--color-{{ token }}</code>
          </div>
        </div>
      }
    </div>
    <h3>Typography</h3>
    <div class="types" data-testid="kit-base-type">
      <div class="type-row">
        <small>sans</small>
        <div>Novel Studio, dense UI copy and controls.</div>
      </div>
      <div class="type-row">
        <small>serif</small>
        <div class="serif">夜色落下来的时候，韩立才从柴房里走出来。Khi màn đêm buông xuống.</div>
      </div>
      <div class="type-row"><small>mono</small><code>novels/novel-0001/chapters/0012.txt</code></div>
    </div>
    <h3>Icon sizes</h3>
    <div class="demo">
      <ns-icon name="folder" size="sm" data-testid="kit-icon-sm" />
      <ns-icon name="folder" size="md" data-testid="kit-icon-md" />
      <ns-icon name="folder" size="lg" data-testid="kit-icon-lg" />
      <ns-icon name="folder" size="xl" data-testid="kit-icon-xl" />
    </div>
    <h3>Icons</h3>
    <div class="icon-grid" data-testid="kit-base-icons">
      @for (name of iconNames; track name) {
        <span
          ><ns-icon [name]="name" /><code>{{ name }}</code></span
        >
      }
    </div>
  `,
  styles: `
    .swatches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--sp-sm);
    }
    .swatch {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: var(--sp-sm);
      align-items: center;
      padding: 6px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 11px;
    }
    .swatch i {
      display: block;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .swatch code,
    .icon-grid code {
      display: block;
      background: none;
      padding: 0;
      font-size: 10.5px;
      color: var(--color-text-tertiary);
      overflow-wrap: anywhere;
    }
    .type-row {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: var(--sp-md);
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .type-row small {
      color: var(--color-text-tertiary);
      font-size: 11px;
    }
    .serif {
      font-family: var(--font-serif);
      font-size: 18px;
      line-height: 1.75;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
      gap: 2px var(--sp-sm);
    }
    .icon-grid span {
      display: flex;
      align-items: center;
      gap: var(--sp-sm);
      padding: 4px;
      color: var(--color-text-secondary);
    }
  `,
  host: { 'data-testid': 'kit-section-base' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitBaseSection {
  readonly colorTokens = COLOR_TOKENS;
  readonly iconNames = Array.from(inject(DOCUMENT).querySelectorAll('symbol[id^="i-"]'), (symbol) => symbol.id.slice(2));
}
