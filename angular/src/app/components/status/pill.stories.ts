import type { Meta, StoryObj } from '@storybook/angular';
import { PillComponent } from './pill.component';

const meta: Meta<PillComponent> = {
  title: 'Components/Pill',
  component: PillComponent,
  args: { tone: 'neutral', plain: false },
  render: (args) => ({ props: args, template: '<ns-pill [tone]="tone" [plain]="plain">Label</ns-pill>' }),
};

export default meta;

type Story = StoryObj<PillComponent>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: 'success' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Danger: Story = { args: { tone: 'danger' } };
export const Info: Story = { args: { tone: 'info' } };
export const Running: Story = { args: { tone: 'running' } };
export const Plain: Story = { args: { plain: true } };
