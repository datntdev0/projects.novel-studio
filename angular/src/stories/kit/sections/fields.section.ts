import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldComponent } from '../../../app/components/form/field.component';
import { InputDirective } from '../../../app/components/form/input.directive';

@Component({
  selector: 'app-kit-fields',
  imports: [FieldComponent, InputDirective],
  template: `
    <h2>Fields</h2>
    <h3>Input</h3>
    <div class="demo col">
      <ns-field label="Label" for="kit-input-default" hint="Helper text">
        <input nsInput id="kit-input-default" placeholder="Placeholder" data-testid="kit-input-default" />
      </ns-field>
      <ns-field label="Label" for="kit-input-error" error="Error message" required data-testid="kit-field-error">
        <input nsInput id="kit-input-error" value="Bad value" data-testid="kit-input-error" />
      </ns-field>
      <ns-field label="Disabled" for="kit-input-disabled">
        <input nsInput id="kit-input-disabled" value="Read only" disabled data-testid="kit-input-disabled" />
      </ns-field>
      <ns-field label="Mono" for="kit-input-mono">
        <input
          nsInput
          mono
          id="kit-input-mono"
          value="novels
-0006chapters\\"
          data-testid="kit-input-mono"
        />
      </ns-field>
    </div>
    <h3>Textarea and select</h3>
    <div class="demo col">
      <ns-field label="Textarea" for="kit-textarea-default">
        <textarea nsInput id="kit-textarea-default" rows="2" data-testid="kit-textarea-default">Description</textarea>
      </ns-field>
      <ns-field label="Select" for="kit-select-default">
        <select nsInput id="kit-select-default" data-testid="kit-select-default">
          <option>Claude CLI</option>
          <option>Codex CLI</option>
        </select>
      </ns-field>
    </div>
  `,
  host: { 'data-testid': 'kit-section-fields' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitFieldsSection {}
