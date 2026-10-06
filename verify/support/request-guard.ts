import type { Page } from '@playwright/test';
import { devServerUrl } from './dev-server.ts';

export function guardRequests(page: Page): string[] {
  const blocked: string[] = [];
  const allowedOrigin = new URL(devServerUrl).origin;
  void page.route(
    (url) => url.origin !== allowedOrigin,
    (route) => {
      blocked.push(route.request().url());
      return route.abort();
    },
  );
  return blocked;
}
