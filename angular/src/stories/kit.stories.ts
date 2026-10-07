import type { Meta, StoryObj } from '@storybook/angular';
import { KitPageComponent } from './kit/kit-page.component';

const meta: Meta<KitPageComponent> = {
  title: 'Reference/Kit',
  component: KitPageComponent,
  parameters: { layout: 'fullscreen' },
  tags: ['!autodocs'],
};

export default meta;

export const FullList: StoryObj<KitPageComponent> = {};
