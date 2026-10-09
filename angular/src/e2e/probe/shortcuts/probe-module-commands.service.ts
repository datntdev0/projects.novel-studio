import { Injectable, inject, signal } from '@angular/core';
import { CommandService } from '../../../app/core/shortcuts/command.service';

@Injectable({ providedIn: 'root' })
export class ProbeModuleCommands {
  private readonly commands = inject(CommandService);
  private registered = false;
  private readonly count = signal(0);

  readonly runs = this.count.asReadonly();

  register(): void {
    if (this.registered) return;
    this.registered = true;
    this.commands.register([
      {
        id: 'probe.module-action',
        labelKey: 'dev.probe.moduleAction',
        keywords: ['probe', 'module'],
        keys: ['Ctrl+Shift+L'],
        scope: 'probe',
        needsNovel: false,
        run: () => this.count.update((value) => value + 1),
      },
    ]);
  }
}
