import { pathToFileURL } from 'node:url';
import { test, expect, saveEvidence } from '../../support/electron.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';

test('S5 electron blocks remote content and navigation (AC-10)', async ({ app, window, appRoot }) => {
  await expect(window.getByTestId('app-hello-title')).toBeVisible();
  const startUrl = window.url();

  await window.evaluate(() => {
    const dom = globalThis as unknown as RendererGlobals;
    const script = dom.document.createElement('script');
    script.src = 'https://example.com/remote.js';
    script.onload = () => (dom.remoteScriptRan = true);
    dom.document.head.appendChild(script);
    const img = dom.document.createElement('img');
    img.src = 'https://example.com/remote.png';
    dom.document.body.appendChild(img);
  });
  await expectAppLog(appRoot, /\[warn\]\s+\[renderer\] blocked csp script-src\S* https:\/\/example\.com\//);
  await expectAppLog(appRoot, /\[warn\]\s+\[renderer\] blocked csp img-src https:\/\/example\.com\//);

  const navigate = (url: string) =>
    window.evaluate(
      (target) =>
        (globalThis as unknown as RendererGlobals).setTimeout(() => ((globalThis as unknown as RendererGlobals).location.href = target)),
      url,
    );
  await navigate('https://example.com/page');
  await expectAppLog(appRoot, /\[warn\]\s+blocked navigation https:\/\/example\.com\/page/);
  await navigate(pathToFileURL(appRoot).href);
  await expectAppLog(appRoot, /\[warn\]\s+blocked navigation file:\/\//);

  await window.evaluate(() => void (globalThis as unknown as RendererGlobals).open('https://example.com/popup'));
  await expectAppLog(appRoot, /\[warn\]\s+blocked window-open https:\/\/example\.com\/popup/);

  expect(await window.evaluate(() => (globalThis as unknown as RendererGlobals).remoteScriptRan)).toBeUndefined();
  expect(app.windows()).toHaveLength(1);
  expect(window.url()).toBe(startUrl);
  expect(await window.getByTestId('app-hello-title').isVisible()).toBe(true);
  await saveEvidence(window, 'blocked');
});
