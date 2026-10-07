import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonDirective } from '../../../app/components/button/button.directive';
import { IconComponent } from '../../../app/components/icon/icon.component';

@Component({
  selector: 'app-kit-buttons',
  imports: [ButtonDirective, IconComponent],
  template: `
    <h2>Buttons</h2>
    <h3>Variants</h3>
    <div class="demo">
      <button nsBtn type="button" data-testid="kit-btn-default">Default</button>
      <button nsBtn variant="primary" type="button" data-testid="kit-btn-primary">Primary</button>
      <button nsBtn variant="ghost" type="button" data-testid="kit-btn-ghost">Ghost</button>
      <button nsBtn variant="danger" type="button" data-testid="kit-btn-danger">Danger</button>
      <button nsBtn variant="danger" solid type="button" data-testid="kit-btn-danger-solid">Delete</button>
      <button nsBtn iconOnly type="button" aria-label="Settings" data-testid="kit-btn-icon"><ns-icon name="settings" /></button>
    </div>
    <h3>Sizes</h3>
    <div class="demo">
      <button nsBtn size="sm" type="button" data-testid="kit-btn-sm">Small</button>
      <button nsBtn size="lg" variant="primary" type="button" data-testid="kit-btn-lg">Large</button>
    </div>
    <h3>States</h3>
    <div class="demo">
      <button nsBtn variant="primary" loading type="button" data-testid="kit-btn-primary-loading">Loading</button>
      <button nsBtn type="button" disabled data-testid="kit-btn-default-disabled">Disabled</button>
      <button nsBtn variant="primary" type="button" disabled data-testid="kit-btn-primary-disabled">Disabled</button>
    </div>
  `,
  host: { 'data-testid': 'kit-section-buttons' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitButtonsSection {}
