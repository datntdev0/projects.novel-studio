import { isNsError, nsError, type NsError } from '@shared/core';

export const toNsError = (error: unknown): NsError =>
  isNsError(error) ? error : nsError('INTERNAL', error instanceof Error ? error.message : 'Internal error');

export const errorKey = (error: NsError): string => `error.${error.code}`;

export const errorDetails = (error: NsError): string => error.detail ?? error.message;
