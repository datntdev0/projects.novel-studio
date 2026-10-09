import { expect, test } from '../../support/test.ts';
import { appearanceText, toggleLanguage } from '../../support/appearance.ts';
import { gotoShell } from '../../support/shell.ts';
import { dotState, statusText } from '../../support/status.ts';

test('S1 busy fixture shows claude ready and codex not logged in (AC-40)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect.poll(() => statusText(page, 'statusbar-cli-claude')).toBe('claude 2.1.288');
  expect(await dotState(page, 'statusbar-cli-claude-dot')).toBe('ok');
  expect(await statusText(page, 'statusbar-cli-codex')).toBe(`codex ${appearanceText('en', 'status.cli.problem.BACKEND_UNAUTHORIZED')}`);
  expect(await dotState(page, 'statusbar-cli-codex-dot')).toBe('warn');
  await expect(page.getByTestId('statusbar-cli-claude')).toHaveAttribute(
    'title',
    appearanceText('en', 'status.cli.title', { name: 'Claude' }),
  );
});

test('S1 the CLI items follow the language (AC-40)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await toggleLanguage(page);
  await expect(page.getByTestId('statusbar-cli-codex')).toHaveText(
    `codex ${appearanceText('vi', 'status.cli.problem.BACKEND_UNAUTHORIZED')}`,
  );
  await expect(page.getByTestId('statusbar-cli-claude')).toHaveAttribute(
    'title',
    appearanceText('vi', 'status.cli.title', { name: 'Claude' }),
  );
});

test('S1 a missing CLI is bad and a generic warning needs attention (AC-40)', async ({ page }) => {
  await gotoShell(page, { fixture: 'cli-problems' });
  await expect.poll(() => statusText(page, 'statusbar-cli-claude')).toBe(`claude ${appearanceText('en', 'status.cli.missing')}`);
  expect(await dotState(page, 'statusbar-cli-claude-dot')).toBe('bad');
  expect(await statusText(page, 'statusbar-cli-codex')).toBe(`codex ${appearanceText('en', 'status.cli.warning')}`);
  expect(await dotState(page, 'statusbar-cli-codex-dot')).toBe('warn');
});

test('S1 a failed detection leaves both CLIs unknown with a neutral dot (AC-40)', async ({ page }) => {
  await gotoShell(page, { fixture: 'fail' });
  for (const name of ['claude', 'codex']) {
    await expect(page.getByTestId(`statusbar-cli-${name}`)).toHaveText(`${name} ${appearanceText('en', 'status.cli.unknown')}`);
    expect(await dotState(page, `statusbar-cli-${name}-dot`)).toBe('neutral');
  }
});
