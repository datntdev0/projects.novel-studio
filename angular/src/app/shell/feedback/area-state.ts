import { signal, type Signal } from '@angular/core';
import type { NsError } from '@shared/core';
import { toNsError } from './error-text';

export type AreaStatus = 'loading' | 'empty' | 'error' | 'ready';

export interface AreaState<T> {
  status: AreaStatus;
  value: T | null;
  error: NsError | null;
}

export interface Area<T> {
  state: Signal<AreaState<T>>;
  reload: () => Promise<void>;
}

export function loadArea<T>(load: () => Promise<T>, isEmpty: (value: T) => boolean): Area<T> {
  const state = signal<AreaState<T>>({ status: 'loading', value: null, error: null });
  let run = 0;

  const reload = async (): Promise<void> => {
    const current = ++run;
    state.set({ status: 'loading', value: null, error: null });
    try {
      const value = await load();
      if (current === run) state.set({ status: isEmpty(value) ? 'empty' : 'ready', value, error: null });
    } catch (error) {
      if (current === run) state.set({ status: 'error', value: null, error: toNsError(error) });
    }
  };

  void reload();
  return { state: state.asReadonly(), reload };
}
