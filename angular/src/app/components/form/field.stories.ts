import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FieldComponent } from './field.component';
import { InputDirective } from './input.directive';

const meta: Meta<FieldComponent> = {
  title: 'Components/Field',
  component: FieldComponent,
  decorators: [moduleMetadata({ imports: [InputDirective] })],
  args: { for: 'story-field-default', label: 'Label', hint: '', error: '', required: false },
  render: (args) => ({
    props: args,
    template: `
      <ns-field [label]="label" [for]="for" [hint]="hint" [error]="error" [required]="required">
        <input nsInput [id]="for" placeholder="Placeholder" />
      </ns-field>
    `,
  }),
};

export default meta;

type Story = StoryObj<FieldComponent>;

export const Default: Story = {};

export const WithHint: Story = { args: { for: 'story-field-hint', hint: 'Helper text' } };

export const Required: Story = { args: { for: 'story-field-required', required: true } };

export const Error: Story = { args: { for: 'story-field-error', error: 'Error message', required: true } };
