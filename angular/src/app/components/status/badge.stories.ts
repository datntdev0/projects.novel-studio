import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Components/Badge',
  component: BadgeComponent,
  args: { count: 7, tone: 'danger', dotOnly: false },
};

export default meta;

type Story = StoryObj<BadgeComponent>;

export const Count: Story = {};
export const Overflow: Story = { args: { count: 120 } };
export const Zero: Story = { args: { count: 0 } };
export const DotOnly: Story = { args: { dotOnly: true } };
export const Neutral: Story = { args: { tone: 'neutral' } };
