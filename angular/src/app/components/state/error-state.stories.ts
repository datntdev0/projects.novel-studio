import type { Meta, StoryObj } from '@storybook/angular';
import { ErrorStateComponent } from './error-state.component';

const meta: Meta<ErrorStateComponent> = {
  title: 'Components/ErrorState',
  component: ErrorStateComponent,
  args: { message: 'Could not read the library information' },
};

export default meta;

export const WithDetails: StoryObj<ErrorStateComponent> = {
  args: { details: 'SqliteError: SQLITE_BUSY: database is locked (library.sqlite)' },
};

export const MessageOnly: StoryObj<ErrorStateComponent> = {};
