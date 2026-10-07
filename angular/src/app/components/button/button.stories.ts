import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonDirective } from './button.directive';
import { IconComponent } from '../icon/icon.component';

interface ButtonArgs {
  variant: 'default' | 'primary' | 'ghost' | 'danger';
  solid: boolean;
  size: 'sm' | 'md' | 'lg';
  iconOnly: boolean;
  loading: boolean;
  disabled: boolean;
  label: string;
}

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  decorators: [moduleMetadata({ imports: [ButtonDirective, IconComponent] })],
  args: { variant: 'default', solid: false, size: 'md', iconOnly: false, loading: false, disabled: false, label: 'Default' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `
      <button nsBtn type="button" [variant]="variant" [solid]="solid" [size]="size" [iconOnly]="iconOnly" [loading]="loading" [disabled]="disabled" [attr.aria-label]="iconOnly ? label : null">
        @if (iconOnly) {
          <ns-icon name="settings" />
        } @else {
          {{ label }}
        }
      </button>
    `,
  }),
};

export default meta;

type Story = StoryObj<ButtonArgs>;

export const Default: Story = {};

export const Primary: Story = { args: { variant: 'primary', label: 'Primary' } };

export const Ghost: Story = { args: { variant: 'ghost', label: 'Ghost' } };

export const Danger: Story = { args: { variant: 'danger', label: 'Danger' } };

export const DangerSolid: Story = { args: { variant: 'danger', solid: true, label: 'Delete' } };

export const IconOnly: Story = { args: { iconOnly: true, label: 'Settings' } };

export const Small: Story = { args: { size: 'sm', label: 'Small' } };

export const Large: Story = { args: { size: 'lg', variant: 'primary', label: 'Large' } };

export const Loading: Story = { args: { variant: 'primary', loading: true, label: 'Loading' } };

export const Disabled: Story = { args: { disabled: true, label: 'Disabled' } };
