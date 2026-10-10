import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, type Page } from '@playwright/test';
import { repoRoot } from './paths.ts';

export type Theme = 'dark' | 'light';
export type TokenTables = { root: Record<string, string>; dark: Record<string, string>; light: Record<string, string> };
export type HtmlState = { lang: string; dataTheme: string; dataBsTheme: string; colorScheme: string; computedColorScheme: string };
export type CheckOutcome = { code: number; stdout: string };
export type BodyStyle = { background: string; color: string; fontSize: string; fontFamily: string };
type ComputedLike = {
  colorScheme: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontFamily: string;
  getPropertyValue(name: string): string;
};
type HtmlGlobals = {
  document: {
    documentElement: { lang: string; style: { colorScheme: string }; getAttribute(name: string): string };
    body: unknown;
    querySelector(selector: string): unknown;
  };
  getComputedStyle(element: unknown): ComputedLike;
};

const run = promisify(execFile);
const script = join(repoRoot, 'tools', 'check-tokens.mjs');

export const SETTINGS_KEY = 'dreamer-studio.settings';
export const ICON_SIZES: Record<string, number> = { 'root-icon-sm': 14, 'root-icon-md': 16, 'root-icon-lg': 20, 'root-icon-xl': 28 };

export const BACKGROUND_RGB: Record<Theme, string> = { dark: 'rgb(16, 18, 17)', light: 'rgb(255, 255, 255)' };
export const BACKGROUND_HEX: Record<Theme, string> = { dark: '#101211', light: '#ffffff' };

export type LookId = 'root-label-look' | 'root-sample-serif' | 'root-set-theme-dark' | 'root-set-theme-light';

export const LOOK_TEXTS: Record<'en' | 'vi', Record<LookId, string>> = {
  en: {
    'root-label-look': 'Look',
    'root-sample-serif': 'Reading font: ẳ ễ ở ự',
    'root-set-theme-dark': 'Dark',
    'root-set-theme-light': 'Light',
  },
  vi: {
    'root-label-look': 'Giao diện mẫu',
    'root-sample-serif': 'Phông chữ đọc: ẳ ễ ở ự',
    'root-set-theme-dark': 'Tối',
    'root-set-theme-light': 'Sáng',
  },
};

export const readHtml = (page: Page): Promise<HtmlState> =>
  page.evaluate(() => {
    const { document, getComputedStyle } = globalThis as unknown as HtmlGlobals;
    const html = document.documentElement;
    return {
      lang: html.lang,
      dataTheme: html.getAttribute('data-theme'),
      dataBsTheme: html.getAttribute('data-bs-theme'),
      colorScheme: html.style.colorScheme,
      computedColorScheme: getComputedStyle(html).colorScheme,
    };
  });

export const htmlState = (lang: 'en' | 'vi', theme: Theme): HtmlState => ({
  lang,
  dataTheme: theme,
  dataBsTheme: theme,
  colorScheme: theme,
  computedColorScheme: theme,
});

export const expectHtml = async (page: Page, lang: 'en' | 'vi', theme: Theme): Promise<void> => {
  await expect.poll(() => readHtml(page)).toEqual(htmlState(lang, theme));
};

export const computedVars = (page: Page, names: string[]): Promise<Record<string, string>> =>
  page.evaluate((list) => {
    const { document, getComputedStyle } = globalThis as unknown as HtmlGlobals;
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(list.map((name) => [name, style.getPropertyValue(name)]));
  }, names);

export const runCheckTokens = async (args: string[]): Promise<CheckOutcome> => {
  try {
    const { stdout } = await run(process.execPath, [script, ...args], { cwd: repoRoot });
    return { code: 0, stdout };
  } catch (error) {
    const failure = error as { code: number; stdout: string };
    return { code: failure.code, stdout: failure.stdout };
  }
};

export const printTokens = async (mockup?: string): Promise<TokenTables> => {
  const { code, stdout } = await runCheckTokens(mockup ? ['--print', mockup] : ['--print']);
  expect(code).toBe(0);
  return JSON.parse(stdout) as TokenTables;
};

export const spriteIds = async (): Promise<string[]> => {
  const shell = await readFile(join(repoRoot, '.claude', 'mockups', 'shell.html'), 'utf8');
  return [...shell.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(([, id]) => id ?? '');
};

export const bodyStyle = (page: Page): Promise<BodyStyle> =>
  page.evaluate(() => {
    const { document, getComputedStyle } = globalThis as unknown as HtmlGlobals;
    const style = getComputedStyle(document.body);
    return {
      background: style.backgroundColor,
      color: style.color,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily.replaceAll('"', ''),
    };
  });

export const bodyBackground = async (page: Page): Promise<string> => (await bodyStyle(page)).background;

export const testIdFamily = (page: Page, testId: string): Promise<string> =>
  page.evaluate((id) => {
    const { document, getComputedStyle } = globalThis as unknown as HtmlGlobals;
    return getComputedStyle(document.querySelector(`[data-testid="${id}"]`)).fontFamily.replaceAll('"', '');
  }, testId);

export const testIdColor = (page: Page, testId: string): Promise<string> =>
  page.evaluate((id) => {
    const { document, getComputedStyle } = globalThis as unknown as HtmlGlobals;
    return getComputedStyle(document.querySelector(`[data-testid="${id}"]`)).color;
  }, testId);

type SpriteNode = { children: { tagName: string; id: string }[] };
type SpriteGlobals = { document: { querySelector(selector: string): SpriteNode; querySelectorAll(selector: string): { length: number } } };
type MarkNode = { isConnected: boolean };
type MarkGlobals = { __marker?: string; __node?: MarkNode; document: { querySelector(selector: string): MarkNode | null } };

const NAME_NODE = '[data-testid="root-app-name"]';

export const spriteState = (page: Page): Promise<{ ids: string[]; copies: number }> =>
  page.evaluate(() => {
    const { document } = globalThis as unknown as SpriteGlobals;
    const symbols = [...document.querySelector('[data-testid="icon-sprite"]').children].filter(
      (child) => child.tagName.toLowerCase() === 'symbol',
    );
    return { ids: symbols.map((symbol) => symbol.id), copies: document.querySelectorAll('[data-testid="icon-sprite"]').length };
  });

export const expectIconBoxes = async (page: Page): Promise<void> => {
  for (const [testId, size] of Object.entries(ICON_SIZES)) {
    const box = await page.getByTestId(testId).boundingBox();
    expect([testId, box?.width, box?.height]).toEqual([testId, size, size]);
  }
};

export const markNode = (page: Page): Promise<void> =>
  page.evaluate((selector) => {
    const globals = globalThis as unknown as MarkGlobals;
    globals.__marker = 'kept';
    globals.__node = globals.document.querySelector(selector) ?? undefined;
  }, NAME_NODE);

export const nodeKept = (page: Page): Promise<boolean> =>
  page.evaluate((selector) => {
    const globals = globalThis as unknown as MarkGlobals;
    const node = globals.__node;
    return globals.__marker === 'kept' && !!node && node.isConnected && node === globals.document.querySelector(selector);
  }, NAME_NODE);

export const withTempFolder = async <T>(action: (folder: string) => Promise<T>): Promise<T> => {
  const folder = await mkdtemp(join(tmpdir(), 'ns-tokens-'));
  try {
    return await action(folder);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
};
