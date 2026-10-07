import type { Meta, StoryObj } from '@storybook/angular';

interface CheckArgs {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

const meta: Meta<CheckArgs> = {
  title: 'CSS/Check',
  args: { label: 'Unchecked', checked: false, indeterminate: false, disabled: false },
  render: (args) => ({
    props: args,
    template:
      '<label class="check"><input type="checkbox" [checked]="checked" [indeterminate]="indeterminate" [disabled]="disabled" />{{ label }}</label>',
  }),
};

export default meta;

type Story = StoryObj<CheckArgs>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { label: 'Checked', checked: true } };

export const Indeterminate: Story = { args: { label: 'Some selected', indeterminate: true } };

export const Disabled: Story = { args: { label: 'Disabled', disabled: true } };
