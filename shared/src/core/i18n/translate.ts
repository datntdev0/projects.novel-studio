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

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

export function formatRelativeTime(language: Language, value: Date | number | string, now: number = Date.now()): string {
  const seconds = (new Date(value).getTime() - now) / 1000;
  const [unit, size] = RELATIVE_UNITS.find(([, unitSize]) => Math.abs(seconds) >= unitSize) ?? ['second', 1];
  return new Intl.RelativeTimeFormat(INTL_LOCALES[language], { numeric: 'always', style: 'narrow' }).format(
    Math.trunc(seconds / size),
    unit,
  );
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
