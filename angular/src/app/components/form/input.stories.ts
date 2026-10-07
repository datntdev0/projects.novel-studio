import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FieldComponent } from './field.component';
import { InputDirective } from './input.directive';

interface InputArgs {
  kind: 'input' | 'textarea' | 'select';
  label: string;
  mono: boolean;
  invalid: boolean;
  disabled: boolean;
  value: string;
  id: string;
}

const meta: Meta<InputArgs> = {
  title: 'Components/Input',
  decorators: [moduleMetadata({ imports: [FieldComponent, InputDirective] })],
  args: { kind: 'input', label: 'Label', mono: false, invalid: false, disabled: false, value: 'Value', id: 'story-input-default' },
  argTypes: { kind: { control: 'inline-radio', options: ['input', 'textarea', 'select'] } },
  render: (args) => ({
    props: args,
    template: `
      <ns-field [label]="label" [for]="id">
        @switch (kind) {
          @case ('textarea') {
            <textarea nsInput [id]="id" rows="2" [mono]="mono" [invalid]="invalid" [disabled]="disabled">{{ value }}</textarea>
          }
          @case ('select') {
            <select nsInput [id]="id" [mono]="mono" [invalid]="invalid" [disabled]="disabled">
              <option>Claude CLI</option>
              <option>Codex CLI</option>
            </select>
          }
          @default {
            <input nsInput [id]="id" [mono]="mono" [invalid]="invalid" [disabled]="disabled" [value]="value" />
          }
        }
      </ns-field>
    `,
  }),
};

export default meta;

type Story = StoryObj<InputArgs>;

export const Input: Story = {};

export const Invalid: Story = { args: { invalid: true, value: 'Bad value', id: 'story-input-error' } };

export const Disabled: Story = { args: { disabled: true, value: 'Read only', id: 'story-input-disabled' } };

export const Mono: Story = { args: { mono: true, value: 'novels/0006/chapters', id: 'story-input-mono' } };

export const Textarea: Story = { args: { kind: 'textarea', value: 'Description', id: 'story-textarea-default' } };

export const Select: Story = { args: { kind: 'select', id: 'story-select-default' } };
