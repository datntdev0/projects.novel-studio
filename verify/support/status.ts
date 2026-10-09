import { type Page } from '@playwright/test';

export type DotState = 'ok' | 'warn' | 'bad' | 'run' | 'neutral';

const DOT_STATES: DotState[] = ['ok', 'warn', 'bad', 'run'];

export async function statusText(page: Page, id: string): Promise<string> {
  return ((await page.getByTestId(id).textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

export async function dotState(page: Page, id: string): Promise<DotState> {
  const classes = ((await page.getByTestId(id).getAttribute('class')) ?? '').split(/\s+/);
  return DOT_STATES.find((state) => classes.includes(state)) ?? 'neutral';
}
