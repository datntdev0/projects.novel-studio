import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { readSettingsJson } from '../../support/settings-file.ts';
import { BACKGROUND_RGB, bodyBackground, expectHtml, expectIconBoxes, markNode, nodeKept, spriteIds, spriteState, type Theme } from '../../support/theme.ts';
import type { Page } from '../../support/test.ts';

type FontFaceLike = { family: string; style: string; status: string };
type AppGlobals = {
  document: {
    fonts: {
      ready: Promise<unknown>;
      check(font: string): boolean;
      load(font: string): Promise<unknown>;
      [Symbol.iterator](): Iterator<FontFaceLike>;
    };
  };
};

const loadedFaces = (window: Page): Promise<{ inter: boolean; faces: Record<string, string[]> }> =>
  window.evaluate(async () => {
    const { document } = globalThis as unknown as AppGlobals;
    await document.fonts.ready;
    await document.fonts.load('13px Inter');
    await document.fonts.load('18px "Source Serif 4"');
    const faces: Record<string, string[]> = {};
    for (const face of document.fonts) {
      if (face.style !== 'normal') continue;
      const family = face.family.replaceAll('"', '');
      faces[family] = [...(faces[family] ?? []), face.status];
    }
    return { inter: document.fonts.check('13px Inter'), faces };
  });

const expectTheme = async (window: Page, theme: Theme): Promise<void> => {
  await expectHtml(window, 'en', theme);
  await expect(window.getByTestId('root-app-theme')).toHaveText(theme);
  await expect.poll(() => bodyBackground(window)).toBe(BACKGROUND_RGB[theme]);
};

test('S7 fonts, icons and theme work in Electron (AC-14, AC-15)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expectTheme(window, 'dark');

    const { inter, faces } = await loadedFaces(window);
    expect(inter).toBe(true);
    for (const family of ['Inter', 'Source Serif 4']) {
      expect(faces[family]?.length).toBeGreaterThan(0);
      expect(new Set(faces[family])).toEqual(new Set(['loaded']));
    }

    const { ids } = await spriteState(window);
    expect(ids).toEqual(await spriteIds());
    await expectIconBoxes(window);
    await saveEvidence(window, 'dark');

    await markNode(window);
    await window.getByTestId('root-set-theme-light').click();
    await expectTheme(window, 'light');
    expect(await nodeKept(window)).toBe(true);
    await expect.poll(async () => (await readSettingsJson(appRoot))['theme']).toBe('light');
    await saveEvidence(window, 'light');
  });

  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expectTheme(window, 'light');
    await window.getByTestId('root-set-theme-dark').click();
    await expectTheme(window, 'dark');
  });
});
