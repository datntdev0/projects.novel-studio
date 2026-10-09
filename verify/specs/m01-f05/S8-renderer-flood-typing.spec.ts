import { expect, test } from '../../support/test.ts';
import { gotoProbe } from '../../support/appearance.ts';

type LatencyGlobals = { __latencies: number[]; performance: { now(): number }; requestAnimationFrame(callback: () => void): void };
type TimedEvent = { timeStamp: number };

const TYPED = 'abcdefghijklmnopqrst';
const LIMIT_MS = 100;

test('S8 typing and scrolling stay responsive while job updates flood in (AC-47)', async ({ page }) => {
  await gotoProbe(page, 'flood');
  const progress = page.getByTestId('probe-status-progress');
  const seen = new Set<string>();
  await expect
    .poll(
      async () => {
        seen.add((await progress.textContent()) ?? '');
        return seen.size;
      },
      { intervals: [20], timeout: 1000 },
    )
    .toBeGreaterThanOrEqual(5);

  const input = page.getByTestId('probe-input');
  await input.focus();
  await input.evaluate((element) => {
    const globals = globalThis as unknown as LatencyGlobals;
    const latencies: number[] = [];
    globals.__latencies = latencies;
    element.addEventListener('input', (event: TimedEvent) => {
      globals.requestAnimationFrame(() => latencies.push(globals.performance.now() - event.timeStamp));
    });
  });
  await page.keyboard.type(TYPED);
  await expect(input).toHaveValue(TYPED);
  await expect.poll(() => page.evaluate(() => (globalThis as unknown as LatencyGlobals).__latencies.length)).toBe(TYPED.length);
  const latencies = await page.evaluate(() => (globalThis as unknown as LatencyGlobals).__latencies);
  const max = Math.max(...latencies);
  test.info().annotations.push({ type: 'max input latency ms', description: max.toFixed(1) });
  expect(max).toBeLessThan(LIMIT_MS);

  const before = await page.getByTestId('statusbar-job-text').textContent();
  await page.getByTestId('probe-scroll').hover();
  await page.mouse.wheel(0, 40);
  await expect.poll(() => page.getByTestId('probe-scroll').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.getByTestId('statusbar-job-text').textContent()).not.toBe(before);
});
