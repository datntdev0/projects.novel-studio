import { rm } from 'node:fs/promises';
import { test, expect, saveEvidence } from '../../support/electron.ts';
import { copyAppWithoutAngular, launchCopy, storedSettings } from '../../support/first-paint.ts';
import { writeSettingsFile } from '../../support/settings-file.ts';
import { expectHtml, type Theme } from '../../support/theme.ts';

type Case = { name: string; stored: boolean; language: 'en' | 'vi'; theme: Theme };

const cases: Case[] = [
  { name: 'vi-light', stored: true, language: 'vi', theme: 'light' },
  { name: 'en-dark', stored: true, language: 'en', theme: 'dark' },
  { name: 'defaults', stored: false, language: 'en', theme: 'dark' },
];

for (const { name, stored, language, theme } of cases) {
  test(`S8 preload alone sets lang and theme: ${name} (AC-39)`, async ({ appRoot }) => {
    const copyDir = await copyAppWithoutAngular();
    try {
      if (stored) await writeSettingsFile(appRoot, storedSettings(language, theme));
      const app = await launchCopy(copyDir, appRoot);
      try {
        const window = await app.firstWindow();
        await window.waitForLoadState('load');
        await expect(window.getByTestId('root-app-name')).toHaveCount(0);
        await expectHtml(window, language, theme);
        await saveEvidence(window, name);
      } finally {
        await app.close().catch(() => undefined);
      }
    } finally {
      await rm(copyDir, { recursive: true, force: true, maxRetries: 5 });
    }
  });
}
