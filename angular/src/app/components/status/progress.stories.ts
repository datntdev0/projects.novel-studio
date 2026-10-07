import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressComponent } from './progress.component';

const meta: Meta<ProgressComponent> = {
  title: 'Components/Progress',
  component: ProgressComponent,
  args: { value: 40, failed: 0, indeterminate: false, paused: false, size: 'md', label: 'Progress' },
};

export default meta;

type Story = StoryObj<ProgressComponent>;

export const Determinate: Story = {};
export const Failed: Story = { args: { value: 60, failed: 20 } };
export const Paused: Story = { args: { paused: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Large: Story = { args: { size: 'lg' } };
