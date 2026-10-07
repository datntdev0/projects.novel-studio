import type { Meta, StoryObj } from '@storybook/angular';
import { ToastItem, ToastsComponent } from './toasts.component';

const info: ToastItem = { id: 'info', tone: 'info', title: 'Info', body: 'A background task started.' };
const success: ToastItem = { id: 'success', tone: 'success', title: 'Saved', body: 'Your changes were saved.' };
const warning: ToastItem = {
  id: 'warning',
  tone: 'warning',
  title: 'Disk almost full',
  body: 'Free some space to keep saving.',
  action: 'Open storage',
};
const danger: ToastItem = {
  id: 'danger',
  tone: 'danger',
  title: 'Export failed',
  body: 'The file could not be written.',
  details: 'EACCES: permission denied, open "chapter-1.md"',
};

const meta: Meta<ToastsComponent> = {
  title: 'Components/Toasts',
  component: ToastsComponent,
  render: (args) => ({
    props: args,
    template: `<div style="height: 360px; transform: translateZ(0)"><ns-toasts [toasts]="toasts" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<ToastsComponent>;

export const AllTones: Story = { args: { toasts: [info, success, warning, danger] } };

export const WithAction: Story = { args: { toasts: [warning] } };

export const WithDetails: Story = { args: { toasts: [danger] } };
