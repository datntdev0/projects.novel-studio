import type { ElectronApplication } from '@playwright/test';
import { test, expect, withApp } from '../../support/electron.ts';
import { readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';

const TOLERANCE = 8;

const readBounds = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => {
    const [window] = BrowserWindow.getAllWindows();
    if (!window) throw new Error('no window');
    return { ...window.getNormalBounds(), maximized: window.isMaximized() };
  });

const readPrimary = (app: ElectronApplication) => app.evaluate(({ screen }) => screen.getPrimaryDisplay().workArea);

test('S8 moved and resized bounds are restored after relaunch (AC-18)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setBounds({ x: 60, y: 50, width: 1300, height: 800 }));
  });
  const saved = (await readSettingsJson(appRoot)).windowBounds as {
    x: number;
    y: number;
    width: number;
    height: number;
    maximized: boolean;
  };
  expect(saved.maximized).toBe(false);
  expect(Math.abs(saved.width - 1300)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(saved.height - 800)).toBeLessThanOrEqual(TOLERANCE);
  await withApp(appRoot, async (app) => {
    await app.firstWindow();
    const bounds = await readBounds(app);
    expect(bounds.maximized).toBe(false);
    expect(Math.abs(bounds.x - saved.x)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(bounds.y - saved.y)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(bounds.width - saved.width)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(bounds.height - saved.height)).toBeLessThanOrEqual(TOLERANCE);
  });
});

test('S8 a maximised window is maximised again after relaunch (AC-18)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.maximize());
  });
  expect(((await readSettingsJson(appRoot)).windowBounds as { maximized: boolean }).maximized).toBe(true);
  await withApp(appRoot, async (app) => {
    await app.firstWindow();
    expect((await readBounds(app)).maximized).toBe(true);
  });
});

test('S8 an off-screen saved position opens centred on the primary display (AC-18)', async ({ appRoot }) => {
  await writeSettingsFile(appRoot, settingsText({ windowBounds: { x: 20000, y: 100, width: 1300, height: 800, maximized: false } }));
  await withApp(appRoot, async (app) => {
    await app.firstWindow();
    const bounds = await readBounds(app);
    const area = await readPrimary(app);
    expect(bounds.x).toBeLessThan(area.x + area.width);
    expect(bounds.x + bounds.width).toBeGreaterThan(area.x);
    expect(bounds.y).toBeGreaterThanOrEqual(area.y - TOLERANCE);
    const centreX = bounds.x + bounds.width / 2;
    const centreY = bounds.y + bounds.height / 2;
    expect(Math.abs(centreX - (area.x + area.width / 2))).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(centreY - (area.y + area.height / 2))).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(bounds.width - 1300)).toBeLessThanOrEqual(TOLERANCE);
  });
});
