import { expect, type Page } from '@playwright/test';
import { gotoShell } from './shell.ts';
import { SETTINGS_KEY } from './theme.ts';

export type Side = 'left' | 'right' | 'bottom';
export type SeedLayout = Record<string, { left?: number; right?: number; bottom?: number; collapsed?: Side[] }>;
type StorageGlobals = { localStorage: { getItem(key: string): string | null; setItem(key: string, value: string): void } };

export const SIDES: Side[] = ['left', 'right', 'bottom'];
export const KEYS: Record<Side, string> = { left: 'Control+B', right: 'Control+Alt+B', bottom: 'Control+J' };
export const PANEL_DEFAULTS: Record<Side, number> = { left: 272, right: 304, bottom: 208 };
export const PANEL_LIMITS: Record<Side, { min: number; max: number }> = {
  left: { min: 180, max: 480 },
  right: { min: 220, max: 520 },
  bottom: { min: 120, max: 480 },
};
const GROWTH_SIGN: Record<Side, number> = { left: 1, right: -1, bottom: -1 };

export async function panelSize(page: Page, side: Side): Promise<number> {
  const box = await page.getByTestId(`panel-${side}`).boundingBox();
  if (!box) throw new Error(`panel-${side} is not visible`);
  return Math.round(side === 'bottom' ? box.height : box.width);
}

export async function dragGutter(page: Page, side: Side, delta: number): Promise<void> {
  const box = await page.getByTestId(`resizer-${side}`).boundingBox();
  if (!box) throw new Error(`resizer-${side} is not visible`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const shift = delta * GROWTH_SIGN[side];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(side === 'bottom' ? x : x + shift, side === 'bottom' ? y + shift : y, { steps: 5 });
  await page.mouse.up();
}

export async function seedLayout(page: Page, layout: SeedLayout): Promise<void> {
  await page.evaluate(
    ([key, value]) => {
      const storage = (globalThis as unknown as StorageGlobals).localStorage;
      const stored = JSON.parse(storage.getItem(key) ?? '{}') as object;
      storage.setItem(key, JSON.stringify({ ...stored, layout: JSON.parse(value) as object }));
    },
    [SETTINGS_KEY, JSON.stringify(layout)] as const,
  );
  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
}

export const gotoLayout = (page: Page, { hash = 'probe', fixture }: { hash?: string; fixture?: string } = {}): Promise<void> =>
  gotoShell(page, { hash, fixture, probe: true });
