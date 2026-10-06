import type { ErrorCode } from '../errors';
import type { Language } from '../ipc-contract';
import enJson from './en.json';
import viJson from './vi.json';

export interface PluralText {
  one?: string;
  other: string;
}

export type DictionaryValue = string | PluralText | DictionaryTree;

export interface DictionaryTree {
  [key: string]: DictionaryValue;
}

export type Dictionary = DictionaryTree & { error: Record<ErrorCode, string> };

export const en: Dictionary = enJson;
export const vi: Dictionary = viJson;

export const dictionaries: Record<Language, Dictionary> = { en, vi };
