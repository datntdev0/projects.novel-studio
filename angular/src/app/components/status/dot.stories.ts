import type { Meta, StoryObj } from '@storybook/angular';
import { DotComponent } from './dot.component';

const meta: Meta<DotComponent> = { title: 'Components/Dot', component: DotComponent, args: { state: 'neutral' } };

export default meta;

type Story = StoryObj<DotComponent>;

export const Neutral: Story = {};
export const Ok: Story = { args: { state: 'ok' } };
export const Warn: Story = { args: { state: 'warn' } };
export const Bad: Story = { args: { state: 'bad' } };
export const Run: Story = { args: { state: 'run' } };
