import type { Meta, StoryObj } from '@storybook/angular';
import { SegmentedComponent, SegmentedOption } from './segmented.component';

const twoOptions: SegmentedOption[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];
const withIcons: SegmentedOption[] = [
  { value: 'one', label: 'One', icon: 'file' },
  { value: 'two', label: 'Two', icon: 'file' },
  { value: 'three', label: 'Three', icon: 'file' },
];
const iconOnly: SegmentedOption[] = [
  { value: 'grid', label: 'Grid', icon: 'grid', iconOnly: true },
  { value: 'list', label: 'List', icon: 'list', iconOnly: true },
];
const disabledOption: SegmentedOption[] = [...withIcons, { value: 'four', label: 'Four', icon: 'file', disabled: true }];

const meta: Meta<SegmentedComponent> = {
  title: 'Components/Segmented',
  component: SegmentedComponent,
  args: { options: twoOptions, value: 'dark', disabled: false, ariaLabel: 'Theme' },
};

export default meta;

type Story = StoryObj<SegmentedComponent>;

export const TwoOptions: Story = {};

export const WithIcons: Story = { args: { options: withIcons, value: 'one', ariaLabel: 'Steps' } };

export const IconOnly: Story = { args: { options: iconOnly, value: 'grid', ariaLabel: 'Layout' } };

export const DisabledOption: Story = { args: { options: disabledOption, value: 'one', ariaLabel: 'Steps' } };

export const Disabled: Story = { args: { disabled: true, ariaLabel: 'Disabled' } };
