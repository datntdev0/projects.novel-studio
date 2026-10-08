import { expect, type Page } from '@playwright/test';
import { invokeSettings } from './settings-bridge.ts';

export type ShellOptions = { fixture?: string; probe?: boolean; hash?: string };
export type Look = { language?: 'en' | 'vi'; theme?: 'dark' | 'light' };

export async function gotoShell(page: Page, { fixture, probe, hash = 'home' }: ShellOptions = {}): Promise<void> {
  const params = new URLSearchParams();
  if (fixture) params.set('fixture', fixture);
  if (probe) params.set('probe', '1');
  const query = params.size > 0 ? `?${params.toString()}` : '';
  await page.goto(`/${query}#/${hash}`);
  await expect(page.getByTestId('app-shell')).toBeVisible();
}

export async function gotoFoundation(page: Page): Promise<void> {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await expect(page.getByTestId('app-hello-title')).toBeVisible();
}

export async function setLook(window: Page, look: Look): Promise<void> {
  const result = await invokeSettings(window, 'settings:set', look);
  expect(result.ok).toBe(true);
  await window.reload();
  await expect(window.getByTestId('app-shell')).toBeVisible();
}
