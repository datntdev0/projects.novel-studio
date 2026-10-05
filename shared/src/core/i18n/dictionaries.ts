import type { ErrorCode } from '../errors';
import enJson from './en.json';
import viJson from './vi.json';

export interface Dictionary {
  error: Record<ErrorCode, string>;
}

export const en: Dictionary = enJson;
export const vi: Dictionary = viJson;
