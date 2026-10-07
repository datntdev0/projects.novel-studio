import { moduleMetadata, Meta, StoryObj } from '@storybook/angular';
import { ButtonDirective } from '../button/button.directive';
import { InputDirective } from '../form/input.directive';
import { DialogComponent } from './dialog.component';

const meta: Meta<DialogComponent> = {
  title: 'Components/Dialog',
  component: DialogComponent,
  decorators: [moduleMetadata({ imports: [ButtonDirective, InputDirective] })],
  args: { title: 'Default dialog', wide: false },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <button nsBtn type="button" (click)="isOpen = true">Open dialog</button>
      <ns-dialog [(open)]="isOpen" [title]="title" [wide]="wide">
        <input nsInput data-autofocus aria-label="Name" />
        <ng-container dialogFoot>
          <button nsBtn type="button" (click)="isOpen = false">Cancel</button>
          <button nsBtn variant="primary" type="button" (click)="isOpen = false">OK</button>
        </ng-container>
      </ns-dialog>
    `,
  }),
};

export default meta;

type Story = StoryObj<DialogComponent>;

export const Default: Story = {};

export const Wide: Story = { args: { title: 'Wide dialog', wide: true } };
