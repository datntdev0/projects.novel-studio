import { expect, saveEvidence, test, type Page } from '../../support/test.ts';
import { gotoLayout } from '../../support/layout.ts';

type Metrics = { scrollWidth: number; clientWidth: number };
type MeasureGlobals = { document: { documentElement: Metrics } };

const WORKSPACE_WIDTH = 648;
const RIGHT_PANEL_WITH_GUTTER = 308;

const elementMetrics = (page: Page, testId: string): Promise<Metrics> =>
  page.getByTestId(testId).evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));

const pageMetrics = (page: Page): Promise<Metrics> =>
  page.evaluate(() => {
    const { scrollWidth, clientWidth } = (globalThis as unknown as MeasureGlobals).document.documentElement;
    return { scrollWidth, clientWidth };
  });

const hostWidth = async (page: Page): Promise<number> =>
  Math.round((await page.getByTestId('module-host-probe').boundingBox())?.width ?? 0);

const expectNoOverflow = async (page: Page): Promise<void> => {
  for (const metrics of [await pageMetrics(page), await elementMetrics(page, 'topbar'), await elementMetrics(page, 'statusbar')]) {
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  }
};

test.use({ viewport: { width: 1280, height: 720 } });

test('S6 the workspace is 648px wide at the minimum window with three panels and nothing overflows (AC-17)', async ({ page }) => {
  await gotoLayout(page);
  await expect(page.getByTestId('panel-right')).toBeVisible();
  expect(await hostWidth(page)).toBe(WORKSPACE_WIDTH);
  await expectNoOverflow(page);
  await saveEvidence(page, 'three-panels');
});

test('S6 collapsing the right panel grows the workspace by the panel and its gutter (AC-17)', async ({ page }) => {
  await gotoLayout(page);
  await page.getByTestId('topbar-toggle-right').click();
  await expect(page.getByTestId('panel-right')).toBeHidden();
  await expect.poll(() => hostWidth(page)).toBe(WORKSPACE_WIDTH + RIGHT_PANEL_WITH_GUTTER);
  await expectNoOverflow(page);
  await saveEvidence(page, 'right-collapsed');
});
