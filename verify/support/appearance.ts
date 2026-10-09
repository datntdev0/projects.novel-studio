import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import { repoRoot } from './paths.ts';
import { gotoShell } from './shell.ts';
import { expectHtml, type Theme } from './theme.ts';

export type Language = 'en' | 'vi';
type Dictionary = { [key: string]: string | Dictionary };
type MarkerGlobals = { __appearanceMarker?: string };
export type HtmlWrite = { name: string; value: string };
type Mutation = { attributeName: string; target: { getAttribute(name: string): string } };
type PaintGlobals = {
  __writes: HtmlWrite[];
  document: unknown;
  MutationObserver: new (callback: (records: Mutation[]) => void) => { observe(target: unknown, options: object): void };
};
type IconGlobals = { document: { querySelector(selector: string): { getAttribute(name: string): string } | null } };

export const CHORD_LANGUAGE = 'Control+Shift+U';
export const CHORD_THEME = 'Control+Shift+L';
export const THEME_ICON: Record<Theme, string> = { dark: '#i-moon', light: '#i-sun' };
export const SAMPLE_NUMBER: Record<Language, string> = { en: '9,812', vi: '9.812' };
export const SAMPLE_RELATIVE: Record<Language, string> = { en: '2h ago', vi: '2 giờ trước' };
export const DELETE_NAME = 'Chapter 0012';
export const TOAST_TIMEOUT_MS = 5000;
export const NSERROR_DETAILS = 'Traceback: uvicorn exited with code 1';
export const FAIL_DETAILS = 'SQLITE_BUSY: database is locked (fixture=fail)';
export const ERROR_TOAST_DETAILS = 'codex exec → error: not logged in (run `codex login`)';

const dictionaries: Record<Language, Dictionary> = { en: readDictionary('en'), vi: readDictionary('vi') };

function readDictionary(language: Language): Dictionary {
  return JSON.parse(readFileSync(join(repoRoot, 'shared', 'src', 'core', 'i18n', `${language}.json`), 'utf8')) as Dictionary;
}

export function appearanceText(language: Language, key: string, params: Record<string, string | number> = {}): string {
  const found = key
    .split('.')
    .reduce<string | Dictionary | undefined>((node, part) => (typeof node === 'object' ? node[part] : undefined), dictionaries[language]);
  if (typeof found !== 'string') throw new Error(`Missing ${language} text: ${key}`);
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), found);
}

export const toggleLanguage = (page: Page): Promise<void> => page.keyboard.press(CHORD_LANGUAGE);

export const toggleTheme = (page: Page): Promise<void> => page.keyboard.press(CHORD_THEME);

export const themeIcon = (page: Page): Promise<string | null> =>
  page.evaluate(
    () => (globalThis as unknown as IconGlobals).document.querySelector('[data-testid="topbar-theme"] use')?.getAttribute('href') ?? null,
  );

export async function expectLook(page: Page, language: Language, theme: Theme): Promise<void> {
  await expectHtml(page, language, theme);
  await expect(page.getByTestId('topbar-lang')).toHaveText(language.toUpperCase());
  await expect.poll(() => themeIcon(page)).toBe(THEME_ICON[theme]);
}

export const markWindow = (page: Page): Promise<void> =>
  page.evaluate(() => {
    (globalThis as unknown as MarkerGlobals).__appearanceMarker = 'kept';
  });

export const windowKept = async (page: Page): Promise<boolean> =>
  (await page.evaluate(() => (globalThis as unknown as MarkerGlobals).__appearanceMarker)) === 'kept';

export const detailsText = (page: Page, testId: string): Locator => page.getByTestId(`${testId}-details`).locator('pre');

export const gotoProbe = (page: Page, fixture?: string): Promise<void> => gotoShell(page, { fixture, probe: true, hash: 'probe' });

export async function recordHtmlWrites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const g = globalThis as unknown as PaintGlobals;
    g.__writes = [];
    const record = (r: Mutation): number => g.__writes.push({ name: r.attributeName, value: r.target.getAttribute(r.attributeName) });
    new g.MutationObserver((records) => records.forEach(record)).observe(g.document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['lang', 'data-theme'],
    });
  });
}

export const htmlWrites = (page: Page): Promise<HtmlWrite[]> => page.evaluate(() => (globalThis as unknown as PaintGlobals).__writes);
