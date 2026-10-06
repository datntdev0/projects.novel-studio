import { expect, type Page } from '@playwright/test';

type HtmlGlobals = { document: { documentElement: { lang: string } } };
export const ROOT_TEXTS: Record<'en' | 'vi', Record<string, string>> = {
  en: {
    'root-label-name': 'Name',
    'root-label-version': 'Version',
    'root-label-language': 'Language',
    'root-label-theme': 'Theme',
    'root-set-language-en': 'English',
    'root-set-language-vi': 'Vietnamese',
    'root-label-samples': 'Formatting samples',
    'root-label-count': 'Count',
    'root-sample-count-one': '1 chapter',
    'root-sample-count-other': '5 chapters',
    'root-label-date': 'Date',
    'root-label-number': 'Number',
    'root-sample-number': '1,234,567.89',
  },
  vi: {
    'root-label-name': 'Tên',
    'root-label-version': 'Phiên bản',
    'root-label-language': 'Ngôn ngữ',
    'root-label-theme': 'Giao diện',
    'root-set-language-en': 'Tiếng Anh',
    'root-set-language-vi': 'Tiếng Việt',
    'root-label-samples': 'Mẫu định dạng',
    'root-label-count': 'Số lượng',
    'root-sample-count-one': '1 chương',
    'root-sample-count-other': '5 chương',
    'root-label-date': 'Ngày',
    'root-label-number': 'Số',
    'root-sample-number': '1.234.567,89',
  },
};

export async function expectRootLanguage(page: Page, language: 'en' | 'vi'): Promise<void> {
  for (const [testId, text] of Object.entries(ROOT_TEXTS[language])) {
    await expect(page.getByTestId(testId)).toHaveText(text);
  }
  await expect(page.getByTestId('root-app-language')).toHaveText(language);
  await expect.poll(() => page.evaluate(() => (globalThis as unknown as HtmlGlobals).document.documentElement.lang)).toBe(language);
}
