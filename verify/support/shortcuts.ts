import type { Page } from '@playwright/test';

export type NavKey = { chord: string; moduleId: string };

export const NAV_KEYS: NavKey[] = [
  { chord: 'Control+1', moduleId: 'home' },
  { chord: 'Control+2', moduleId: 'library' },
  { chord: 'Control+3', moduleId: 'reader' },
  { chord: 'Control+4', moduleId: 'storyworld' },
  { chord: 'Control+5', moduleId: 'translation' },
  { chord: 'Control+6', moduleId: 'tasks' },
  { chord: 'Control+7', moduleId: 'settings' },
  { chord: 'Control+,', moduleId: 'settings' },
  { chord: 'Control+Shift+T', moduleId: 'tasks' },
];

export type WarningCollector = { has: (...parts: string[]) => boolean };

export function collectWarnings(page: Page): WarningCollector {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  return { has: (...parts) => warnings.some((text) => parts.every((part) => text.includes(part))) };
}
