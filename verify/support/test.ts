import { basename, join, relative, sep } from 'node:path';
import { test, type Page } from '@playwright/test';
import { flowsDir, specsDir } from './paths.ts';

export { test, expect } from '@playwright/test';

export async function saveEvidence(page: Page, name: string): Promise<string> {
  const file = test.info().file;
  const [flow = ''] = relative(specsDir, file).split(sep);
  const spec = basename(file).replace(/(\.electron)?\.spec\.ts$/, '');
  const path = join(flowsDir, flow, 'evidence', `${spec}-${name}.png`);
  await page.screenshot({ path });
  return path;
}
