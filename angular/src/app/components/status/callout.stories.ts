import type { Meta, StoryObj } from '@storybook/angular';
import { CalloutComponent } from './callout.component';

const meta: Meta<CalloutComponent> = {
  title: 'Components/Callout',
  component: CalloutComponent,
  args: { tone: 'info', title: 'Heads up' },
  render: (args) => ({
    props: args,
    template: '<ns-callout [tone]="tone" [title]="title">Something worth knowing about this step.</ns-callout>',
  }),
};

export default meta;

type Story = StoryObj<CalloutComponent>;

export const Info: Story = {};
export const Warning: Story = { args: { tone: 'warning', title: 'Check this' } };
export const Success: Story = { args: { tone: 'success', title: 'All done' } };
export const Danger: Story = { args: { tone: 'danger', title: 'Something failed' } };
