import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonDirective } from '../button/button.directive';
import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'Components/EmptyState',
  component: EmptyStateComponent,
  decorators: [moduleMetadata({ imports: [ButtonDirective] })],
};

export default meta;

export const Full: StoryObj<EmptyStateComponent> = {
  args: { icon: 'library', title: 'No novels yet', text: 'Import a novel from a ZIP package to get started.' },
  render: (args) => ({
    props: args,
    template: `
      <ns-empty-state [icon]="icon" [title]="title" [text]="text">
        <button nsBtn variant="primary" type="button">Import novel</button>
      </ns-empty-state>
    `,
  }),
};

export const Compact: StoryObj<EmptyStateComponent> = { args: { icon: 'tasks', title: 'No running tasks', compact: true } };
