import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';
import { KitBaseSection } from './sections/base.section';

@Component({
  selector: 'app-kit-page',
  imports: [KitBaseSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'kit-page' },
  template: `
    <main class="ref">
      <header class="row between">
        <h1>UI kit reference</h1>
        <div class="row">
          <button type="button" class="btn" data-testid="kit-theme-dark" (click)="theme.setTheme('dark')">Dark</button>
          <button type="button" class="btn" data-testid="kit-theme-light" (click)="theme.setTheme('light')">Light</button>
        </div>
      </header>
      <app-kit-base />
    </main>
  `,
  styles: `
    .ref {
      max-width: 1080px;
      margin-inline: auto;
      padding: var(--sp-xl);
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--sp-xxl);
    }
    .ref > :not(header) {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--sp-md);
      min-width: 0;
    }
    .ref ::ng-deep h2 {
      font-size: 15px;
      padding-bottom: var(--sp-sm);
      border-bottom: 1px solid var(--color-border);
    }
    .ref ::ng-deep h3 {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .ref ::ng-deep .demo {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sp-md);
      align-items: center;
    }
  `,
})
export class KitPageComponent {
  protected readonly theme = inject(ThemeService);
}
