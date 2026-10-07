import { expect, type Page } from '@playwright/test';
import { expectHtml, type Theme } from './theme.ts';

type FocusStyle = { outlineStyle: string; outlineColor: string; boxShadow: string; token: string };
type FocusGlobals = {
  document: {
    activeElement: unknown;
    documentElement: unknown;
    body: { appendChild(node: unknown): void };
    createElement(tag: string): { style: { color: string }; remove(): void };
  };
  getComputedStyle(element: unknown): { outlineStyle: string; outlineColor: string; boxShadow: string; color: string };
};

export const FOCUS_RGB: Record<Theme, string> = { dark: 'rgb(114, 231, 180)', light: 'rgb(21, 122, 82)' };

export const KIT_URL = '/#/dev/kit';

export const KIT_SECTIONS = [
  'base',
  'buttons',
  'status',
  'feedback',
  'fields',
  'choices',
  'overlays',
  'toasts',
  'layout',
  'table',
  'states',
] as const;
export type KitSection = (typeof KIT_SECTIONS)[number];

export const KIT_DEMOS: Record<KitSection, string[]> = {
  base: ['kit-base-colors', 'kit-base-type', 'kit-icon-sm', 'kit-icon-md', 'kit-icon-lg', 'kit-icon-xl', 'kit-base-icons'],
  buttons: [
    'kit-btn-default',
    'kit-btn-primary',
    'kit-btn-ghost',
    'kit-btn-danger',
    'kit-btn-danger-solid',
    'kit-btn-icon',
    'kit-btn-sm',
    'kit-btn-lg',
    'kit-btn-primary-loading',
    'kit-btn-default-disabled',
    'kit-btn-primary-disabled',
  ],
  status: [
    'kit-pill-neutral',
    'kit-pill-success',
    'kit-pill-warning',
    'kit-pill-danger',
    'kit-pill-info',
    'kit-pill-running',
    'kit-pill-plain',
    'kit-badge-0',
    'kit-badge-7',
    'kit-badge-120',
    'kit-badge-dot',
    'kit-dot-neutral',
    'kit-dot-ok',
    'kit-dot-warn',
    'kit-dot-bad',
    'kit-dot-run',
    'kit-kbd',
  ],
  feedback: [
    'kit-callout-info',
    'kit-callout-warning',
    'kit-callout-success',
    'kit-callout-danger',
    'kit-progress-determinate',
    'kit-progress-failed',
    'kit-progress-paused',
    'kit-progress-indeterminate',
    'kit-progress-lg',
  ],
  fields: [
    'kit-field-error',
    'kit-input-default',
    'kit-input-error',
    'kit-input-disabled',
    'kit-input-mono',
    'kit-textarea-default',
    'kit-select-default',
  ],
  choices: [
    'kit-check-unchecked',
    'kit-check-checked',
    'kit-check-indeterminate',
    'kit-check-disabled',
    'kit-segmented-two',
    'kit-segmented-four',
    'kit-segmented-icon',
    'kit-segmented-disabled',
  ],
  overlays: ['kit-dialog-open-default', 'kit-dialog-open-wide', 'kit-dialog-open-confirm'],
  toasts: ['kit-toasts', 'kit-toast-show', 'kit-toasts-info', 'kit-toasts-success', 'kit-toasts-warning', 'kit-toasts-danger'],
  layout: [
    'kit-panel',
    'kit-panel-head',
    'kit-panel-body',
    'kit-panel-foot',
    'kit-panel-flush',
    'kit-row',
    'kit-row-between',
    'kit-col',
    'kit-divider',
    'kit-sep',
  ],
  table: [
    'kit-table',
    'kit-table-row-1',
    'kit-table-row-2',
    'kit-table-row-3',
    'kit-table-row-1-edit',
    'kit-table-row-1-delete',
    'kit-table-row-2-edit',
    'kit-table-row-2-delete',
    'kit-table-row-3-edit',
    'kit-table-row-3-delete',
    'kit-kv',
  ],
  states: ['kit-empty-full', 'kit-empty-full-action', 'kit-empty-compact', 'kit-loading', 'kit-error', 'kit-error-details'],
};

export const TAB_ORDER = [
  'kit-theme-dark',
  'kit-theme-light',
  'kit-btn-default',
  'kit-btn-primary',
  'kit-btn-ghost',
  'kit-btn-danger',
  'kit-btn-danger-solid',
  'kit-btn-icon',
  'kit-btn-sm',
  'kit-btn-lg',
  'kit-btn-primary-loading',
  'kit-input-default',
  'kit-input-error',
  'kit-input-mono',
  'kit-textarea-default',
  'kit-select-default',
  'kit-check-unchecked',
  'kit-check-checked',
  'kit-check-indeterminate',
  'kit-segmented-two-dark',
  'kit-segmented-two-light',
  'kit-segmented-four-one',
  'kit-segmented-four-two',
  'kit-segmented-four-three',
  'kit-segmented-icon-grid',
  'kit-segmented-icon-list',
];

export const SKIPPED_TABS = [
  'kit-btn-default-disabled',
  'kit-btn-primary-disabled',
  'kit-input-disabled',
  'kit-check-disabled',
  'kit-segmented-four-four',
  'kit-segmented-disabled-on',
  'kit-segmented-disabled-off',
];

export const DIALOG_IDS = {
  default: {
    opener: 'kit-dialog-open-default',
    dialog: 'kit-dialog-default',
    scrim: 'kit-dialog-default-scrim',
    close: 'kit-dialog-default-close',
    input: 'kit-dialog-default-input',
    initial: 'kit-dialog-default-input',
    cancel: 'kit-dialog-default-cancel',
    ok: 'kit-dialog-default-ok',
  },
  wide: {
    opener: 'kit-dialog-open-wide',
    dialog: 'kit-dialog-wide',
    scrim: 'kit-dialog-wide-scrim',
    close: 'kit-dialog-wide-close',
    initial: 'kit-dialog-wide-close',
  },
  confirm: {
    opener: 'kit-dialog-open-confirm',
    dialog: 'kit-dialog-confirm',
    scrim: 'kit-dialog-confirm-scrim',
    close: 'kit-dialog-confirm-close',
    cancel: 'kit-dialog-confirm-cancel',
    initial: 'kit-dialog-confirm-cancel',
    confirm: 'kit-dialog-confirm-confirm',
  },
};

export const TOAST_SHOW = 'kit-toast-show';

export const toastIds = (id: string): { toast: string; close: string; action: string; details: string } => ({
  toast: `kit-toasts-${id}`,
  close: `kit-toasts-${id}-close`,
  action: `kit-toasts-${id}-action`,
  details: `kit-toasts-${id}-details`,
});

export const sectionId = (name: KitSection): string => `kit-section-${name}`;

export const openKit = async (page: Page, theme: Theme): Promise<void> => {
  await page.goto(KIT_URL);
  await expect(page.getByTestId('kit-page')).toBeVisible();
  await page.getByTestId(`kit-theme-${theme}`).click();
  await expectHtml(page, 'en', theme);
};

export const focusStyle = (page: Page): Promise<FocusStyle> =>
  page.evaluate(() => {
    const { document, getComputedStyle } = globalThis as unknown as FocusGlobals;
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-focus)';
    document.body.appendChild(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    const { outlineStyle, outlineColor, boxShadow } = getComputedStyle(document.activeElement);
    return { outlineStyle, outlineColor, boxShadow, token };
  });

export const hasFocusRing = async (page: Page): Promise<boolean> => {
  const { outlineStyle, outlineColor, boxShadow, token } = await focusStyle(page);
  return (outlineStyle !== 'none' && outlineColor === token) || boxShadow.includes(token);
};
