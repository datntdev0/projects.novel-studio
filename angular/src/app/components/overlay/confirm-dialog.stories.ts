import { moduleMetadata, Meta, StoryObj } from '@storybook/angular';
import { ButtonDirective } from '../button/button.directive';
import { ConfirmDialogComponent } from './confirm-dialog.component';

const meta: Meta<ConfirmDialogComponent> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialogComponent,
  decorators: [moduleMetadata({ imports: [ButtonDirective] })],
  args: { title: 'Discard changes?', message: 'Your edits are not saved and will be lost.', confirmLabel: 'Discard changes', danger: true },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <button nsBtn type="button" (click)="isOpen = true">Open confirm</button>
      <ns-confirm-dialog [(open)]="isOpen" [title]="title" [message]="message" [confirmLabel]="confirmLabel" [danger]="danger" />
    `,
  }),
};

export default meta;

type Story = StoryObj<ConfirmDialogComponent>;

export const Danger: Story = {};

export const Neutral: Story = {
  args: { title: 'Publish chapter?', message: 'The chapter becomes visible to readers.', confirmLabel: 'Publish', danger: false },
};
