import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KitBaseSection } from './sections/base.section';
import { KitButtonsSection } from './sections/buttons.section';
import { KitStatusSection } from './sections/status.section';
import { KitFeedbackSection } from './sections/feedback.section';
import { KitFieldsSection } from './sections/fields.section';
import { KitChoicesSection } from './sections/choices.section';
import { KitOverlaysSection } from './sections/overlays.section';
import { KitToastsSection } from './sections/toasts.section';
import { KitLayoutSection } from './sections/layout.section';
import { KitTableSection } from './sections/table.section';
import { KitStatesSection } from './sections/states.section';

@Component({
  selector: 'app-kit-page',
  imports: [
    KitBaseSection,
    KitButtonsSection,
    KitStatusSection,
    KitFeedbackSection,
    KitFieldsSection,
    KitChoicesSection,
    KitOverlaysSection,
    KitToastsSection,
    KitLayoutSection,
    KitTableSection,
    KitStatesSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'kit-page' },
  template: `
    <main class="ref">
      <header class="row between">
        <h1>UI kit reference</h1>
      </header>
      <app-kit-base />
      <app-kit-buttons />
      <app-kit-status />
      <app-kit-feedback />
      <app-kit-fields />
      <app-kit-choices />
      <app-kit-overlays />
      <app-kit-toasts />
      <app-kit-layout />
      <app-kit-table />
      <app-kit-states />
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
  `,
})
export class KitPageComponent {}
