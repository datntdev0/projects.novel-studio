import type { Language } from '../ipc-contract';
import { dictionaries, type DictionaryValue, type PluralText } from './dictionaries';

export type TranslateParams = Record<string, string | number>;

export const INTL_LOCALES: Record<Language, string> = { en: 'en-US', vi: 'vi-VN' };

export function formatNumber(language: Language, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALES[language], options).format(value);
}

export function formatDate(language: Language, value: Date | number, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[language], options).format(value);
}

function isPlural(value: DictionaryValue | undefined): value is PluralText {
  return typeof value === 'object' && typeof value.other === 'string';
}

function lookup(language: Language, key: string): string | PluralText | undefined {
  let node: DictionaryValue | undefined = dictionaries[language];
  for (const segment of key.split('.')) {
    node = typeof node === 'object' && !isPlural(node) ? node[segment] : undefined;
  }
  return typeof node === 'string' || isPlural(node) ? node : undefined;
}

function pickText(language: Language, text: string | PluralText, params?: TranslateParams): string {
  if (typeof text === 'string') return text;
  const form = new Intl.PluralRules(INTL_LOCALES[language]).select(Number(params?.count ?? 0));
  return (form === 'one' ? text.one : undefined) ?? text.other;
}

function interpolate(language: Language, text: string, params?: TranslateParams): string {
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params?.[name];
    if (value === undefined) return placeholder;
    return typeof value === 'number' ? formatNumber(language, value) : value;
  });
}

export function translate(language: Language, key: string, params?: TranslateParams): string {
  const text = lookup(language, key) ?? lookup('en', key);
  return text === undefined ? key : interpolate(language, pickText(language, text, params), params);
}
