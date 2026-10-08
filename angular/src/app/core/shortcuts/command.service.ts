import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { SHORTCUT_CONTEXT, type Command } from './command';
import { KeybindingService } from './keybinding.service';
import { normalizeChord } from './key-chord';

@Injectable({ providedIn: 'root' })
export class CommandService {
  private readonly context = inject(SHORTCUT_CONTEXT);
  private readonly keybindings = inject(KeybindingService);
  private readonly registered = signal<Command[]>([]);

  readonly commands = this.registered.asReadonly();
  readonly refused = new Subject<Command>();

  constructor() {
    document.addEventListener('keydown', (event) => {
      const id = this.keybindings.resolve(event);
      if (id !== null) {
        event.preventDefault();
        this.run(id);
      }
    });
  }

  register(commands: Command[]): () => void {
    const added: Command[] = [];
    for (const command of commands) {
      if (this.registered().some((item) => item.id === command.id) || added.some((item) => item.id === command.id)) {
        console.warn(`Command ${command.id} refused: id already registered`);
        continue;
      }
      const keys = command.keys.map(normalizeChord).filter((chord) => this.keybindings.bind(command.scope, chord, command.id));
      added.push({ ...command, keys });
    }
    this.registered.update((current) => [...current, ...added]);
    return () => this.remove(added);
  }

  run(id: string): void {
    const command = this.registered().find((item) => item.id === id);
    if (command === undefined) {
      return;
    }
    if (command.needsNovel && !this.context.novelOpen()) {
      this.refused.next(command);
      return;
    }
    command.run();
  }

  private remove(commands: Command[]): void {
    const present = commands.filter((command) => this.registered().includes(command));
    if (present.length === 0) {
      return;
    }
    present.forEach((command) => command.keys.forEach((chord) => this.keybindings.unbind(command.scope, chord, command.id)));
    this.registered.update((current) => current.filter((command) => !present.includes(command)));
  }
}
