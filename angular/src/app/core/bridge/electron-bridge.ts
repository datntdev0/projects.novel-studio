import type { Bridge, IpcContract } from '@shared/core';

export class ElectronBridge implements Bridge {
  on: Bridge['on'] = (event, handler) => window.novelStudio.on(event, handler);

  async invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']> {
    const result = await window.novelStudio.invoke(channel, req);
    if (!result.ok) {
      throw result.error;
    }
    return result.value;
  }
}
