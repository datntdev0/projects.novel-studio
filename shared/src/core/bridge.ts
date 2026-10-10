import type { IpcContract, IpcEvents } from './ipc-contract';
import type { IpcResult } from './errors';

export type EventSubscriber = <E extends keyof IpcEvents>(event: E, handler: (payload: IpcEvents[E]) => void) => () => void;

export interface Bridge {
  invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']>;
  on: EventSubscriber;
}

export interface DreamerStudioApi {
  invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcResult<IpcContract[C]['res']>>;
  on: EventSubscriber;
}
