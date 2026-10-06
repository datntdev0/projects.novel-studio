import { test, expect, saveEvidence } from '../../support/electron.ts';

test('S2 electron window has the title, minimum size and clamped default size (AC-8)', async ({ app, window }) => {
  await expect(window.getByTestId('app-hello-title')).toBeVisible();
  const result = await app.evaluate(({ BrowserWindow, screen }) => {
    const windows = BrowserWindow.getAllWindows();
    const area = screen.getPrimaryDisplay().workArea;
    const [first] = windows;
    return {
      count: windows.length,
      title: first?.getTitle(),
      minimumSize: first?.getMinimumSize(),
      size: first ? { width: first.getBounds().width, height: first.getBounds().height } : null,
      expected: { width: Math.min(1440, area.width), height: Math.min(900, area.height) },
    };
  });
  expect(result.count).toBe(1);
  expect(result.title).toBe('Novel Studio');
  expect(result.minimumSize).toEqual([1280, 720]);
  expect(Math.abs((result.size?.width ?? 0) - result.expected.width)).toBeLessThanOrEqual(2);
  expect(Math.abs((result.size?.height ?? 0) - result.expected.height)).toBeLessThanOrEqual(2);
  await saveEvidence(window, 'window');
});
