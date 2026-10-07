import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = { title: 'CSS/Kbd' };

export default meta;

export const Default: StoryObj = { render: () => ({ template: '<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>T</kbd>' }) };
