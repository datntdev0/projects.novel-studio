import type { Meta, StoryObj } from '@storybook/angular';
import { LoadingStateComponent } from './loading-state.component';

const meta: Meta<LoadingStateComponent> = {
  title: 'Components/LoadingState',
  component: LoadingStateComponent,
  args: { label: 'Loading library information' },
};

export default meta;

export const Default: StoryObj<LoadingStateComponent> = {};
