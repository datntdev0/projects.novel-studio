import { expect, test } from '@playwright/test';
import { gotoShell, openFirstNovel } from '../../support/shell.ts';

type Expected = { state: string; count: string; first: string; stats: string; jobs: Record<string, string> };

const NO_JOBS: Record<string, string> = {};
const BUSY_JOBS: Record<string, string> = { 'job-running': 'running', 'job-interrupted': 'paused', 'job-failed-items': 'completed' };
const CLIS: Record<string, string> = { claude: 'ready', codex: 'warning' };
const ASSIGNMENTS: Record<string, string> = { translation: 'codex', analysis: 'claude' };

const NONE_EXPECTED: Expected = { state: 'open', count: '7', first: '斗破苍穹', stats: '7', jobs: NO_JOBS };
const BUSY_EXPECTED: Expected = { state: 'open', count: '7', first: '斗破苍穹', stats: '7', jobs: BUSY_JOBS };

const EMPTY_EXPECTED: Expected = { ...NONE_EXPECTED, count: '0', first: '', stats: '0' };
const FIRST_RUN_EXPECTED: Expected = { ...NONE_EXPECTED, state: 'closed' };

const CASES: Array<{ fixture: string | undefined; expected: Expected }> = [
  { fixture: 'none', expected: NONE_EXPECTED },
  { fixture: undefined, expected: NONE_EXPECTED },
  { fixture: 'empty', expected: EMPTY_EXPECTED },
  { fixture: 'busy', expected: BUSY_EXPECTED },
  { fixture: 'first-run', expected: FIRST_RUN_EXPECTED },
];

async function expectProbe(page: import('@playwright/test').Page, expected: Expected): Promise<void> {
  await expect(page.getByTestId('probe')).toBeVisible();
  await expect(page.getByTestId('probe-stats-novels')).toHaveText(expected.stats);
  await expect(page.getByTestId('probe-library-state')).toHaveText(expected.state);
  await expect(page.getByTestId('probe-novel-count')).toHaveText(expected.count);
  await expect(page.getByTestId('probe-novel-first')).toHaveText(expected.first);
  for (const [name, state] of Object.entries(CLIS)) await expect(page.getByTestId(`probe-cli-${name}`)).toHaveText(state);
  for (const [taskType, cli] of Object.entries(ASSIGNMENTS)) await expect(page.getByTestId(`probe-assignment-${taskType}`)).toHaveText(cli);
  for (const [id, state] of Object.entries(expected.jobs)) await expect(page.getByTestId(`probe-job-${id}`)).toHaveText(state);
  await expect(page.locator('[data-testid^="probe-job-"]')).toHaveCount(Object.keys(expected.jobs).length);
}

for (const { fixture, expected } of CASES) {
  test(`S6 fixture ${fixture ?? 'missing param'} shows its data in the probe (AC-61)`, async ({ page }) => {
    await gotoShell(page, { fixture, probe: true, hash: 'probe' });
    await expectProbe(page, expected);
  });
}

test('S6 an unknown fixture falls back to none (AC-61)', async ({ page }) => {
  await gotoShell(page, { fixture: 'nope', probe: true, hash: 'probe' });
  await expectProbe(page, NONE_EXPECTED);
});

test('S6 the probe opens and closes a novel and the reader is guarded while closed (AC-61)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
  await expect(page.getByTestId('probe-novel-count')).toHaveText('7');
  await expect(page.getByTestId('probe-open-novel')).toHaveText('none');
  await openFirstNovel(page);
  await page.getByTestId('probe-close-novel').click();
  await expect(page.getByTestId('probe-open-novel')).toHaveText('none');
  await page.evaluate("location.hash = '#/reader'");
  await expect(page.getByTestId('module-host-home')).toBeAttached();
  expect(page.url()).toContain('#/home');
});

test('S6 the probe and the busy values survive a reload (AC-61)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
  await expectProbe(page, BUSY_EXPECTED);
  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectProbe(page, BUSY_EXPECTED);
});
