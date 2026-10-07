import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';
import { ButtonDirective } from '../../ui/button/button.directive';
import { KitBaseSection } from './sections/base.section';
import { KitButtonsSection } from './sections/buttons.section';
import { KitStatusSection } from './sections/status.section';
import { KitFeedbackSection } from './sections/feedback.section';
import { KitFieldsSection } from './sections/fields.section';
import { KitChoicesSection } from './sections/choices.section';
import { KitOverlaysSection } from './sections/overlays.section';
import { KitToastsSection } from './sections/toasts.section';

@Component({
  selector: 'app-kit-page',
  imports: [
    ButtonDirective,
    KitBaseSection,
    KitButtonsSection,
    KitStatusSection,
    KitFeedbackSection,
    KitFieldsSection,
    KitChoicesSection,
    KitOverlaysSection,
    KitToastsSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'kit-page' },
  template: `
    <main class="ref">
      <header class="row between">
        <h1>UI kit reference</h1>
        <div class="row">
          <button nsBtn type="button" data-testid="kit-theme-dark" (click)="theme.setTheme('dark')">Dark</button>
          <button nsBtn type="button" data-testid="kit-theme-light" (click)="theme.setTheme('light')">Light</button>
        </div>
      </header>
      <app-kit-base />
      <app-kit-buttons />
      <app-kit-status />
      <app-kit-feedback />
      <app-kit-fields />
      <app-kit-choices />
      <app-kit-overlays />
      <app-kit-toasts />
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
    .ref > :not(header) > ::ng-deep h2 {
      font-size: 15px;
      padding-bottom: var(--sp-sm);
      border-bottom: 1px solid var(--color-border);
    }
    .ref > :not(header) > ::ng-deep h3 {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .ref > :not(header) > ::ng-deep .demo {
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
