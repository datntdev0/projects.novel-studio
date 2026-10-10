import type { DreamerStudioApi } from '@shared/core';

declare global {
  interface Window {
    dreamerStudio: DreamerStudioApi;
  }
}
