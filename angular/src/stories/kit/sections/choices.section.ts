import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SegmentedComponent, SegmentedOption } from '../../../app/components/form/segmented.component';

@Component({
  selector: 'app-kit-choices',
  styleUrls: ['../kit-section.css'],
  imports: [SegmentedComponent],
  template: `
    <h2>Choices</h2>
    <h3>Checkbox</h3>
    <div class="demo">
      <label class="check"><input type="checkbox" data-testid="kit-check-unchecked" />Unchecked</label>
      <label class="check"><input type="checkbox" checked data-testid="kit-check-checked" />Checked</label>
      <label class="check"><input type="checkbox" [indeterminate]="true" data-testid="kit-check-indeterminate" />Some selected</label>
      <label class="check"><input type="checkbox" disabled data-testid="kit-check-disabled" />Disabled</label>
    </div>
    <h3>Segmented</h3>
    <div class="demo">
      <ns-segmented [options]="two" [(value)]="twoValue" ariaLabel="Theme" testId="kit-segmented-two" data-testid="kit-segmented-two" />
      <ns-segmented [options]="four" [(value)]="fourValue" ariaLabel="Steps" testId="kit-segmented-four" data-testid="kit-segmented-four" />
      <ns-segmented
        [options]="icons"
        [(value)]="iconValue"
        ariaLabel="Layout"
        testId="kit-segmented-icon"
        data-testid="kit-segmented-icon"
      />
      <ns-segmented
        [options]="toggle"
        [(value)]="toggleValue"
        disabled
        ariaLabel="Disabled"
        testId="kit-segmented-disabled"
        data-testid="kit-segmented-disabled"
      />
    </div>
  `,
  host: { 'data-testid': 'kit-section-choices' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitChoicesSection {
  readonly two: SegmentedOption[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];
  readonly four: SegmentedOption[] = [
    { value: 'one', label: 'One', icon: 'file' },
    { value: 'two', label: 'Two', icon: 'file' },
    { value: 'three', label: 'Three', icon: 'file' },
    { value: 'four', label: 'Four', icon: 'file', disabled: true },
  ];
  readonly icons: SegmentedOption[] = [
    { value: 'grid', label: 'Grid', icon: 'grid', iconOnly: true },
    { value: 'list', label: 'List', icon: 'list', iconOnly: true },
  ];
  readonly toggle: SegmentedOption[] = [
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ];
  readonly twoValue = signal('dark');
  readonly fourValue = signal('one');
  readonly iconValue = signal('grid');
  readonly toggleValue = signal('on');
}
