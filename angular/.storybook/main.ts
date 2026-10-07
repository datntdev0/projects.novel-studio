import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  framework: '@storybook/angular',
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  webpackFinal: async (webpackConfig) => {
    const rules = (webpackConfig.module?.rules ?? []).map((rule) =>
      typeof rule === 'object' && rule?.test instanceof RegExp && rule.test.test('icons.svg') ? { ...rule, exclude: /icons\.svg$/ } : rule,
    );
    rules.push({ test: /icons\.svg$/, type: 'asset/source' });
    return { ...webpackConfig, module: { ...webpackConfig.module, rules } };
  },
};

export default config;
