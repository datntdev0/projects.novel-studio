import type { NovelStudioApi } from '@shared/core';

declare global {
  interface Window {
    novelStudio: NovelStudioApi;
  }
}
