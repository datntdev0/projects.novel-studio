import { provideZonelessChangeDetection } from '@angular/core';
import { applicationConfig, type Preview } from '@storybook/angular';
import { applyTheme } from '@shared/core';
import { provideBridge } from '../src/app/core/bridge/bridge.provider.e2e';
import { provideSettings } from '../src/app/core/settings/settings.provider';
import { provideI18n } from '../src/app/core/i18n/i18n.provider';
import { provideIconSprite } from '../src/app/components/icon/icon-sprite.provider';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'dark',
      toolbar: { title: 'Theme', icon: 'circlehollow', items: ['dark', 'light'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'dark' },
  parameters: { options: { storySort: { order: ['Reference', 'Foundations', 'CSS', 'Components'] } } },
  decorators: [
    applicationConfig({
      providers: [provideZonelessChangeDetection(), provideBridge(), provideSettings(), provideI18n(), provideIconSprite()],
    }),
    (story, context) => {
      applyTheme(document.documentElement, context.globals['theme'] === 'light' ? 'light' : 'dark');
      return story();
    },
  ],
};

export default preview;
