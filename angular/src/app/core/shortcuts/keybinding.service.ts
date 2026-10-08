import { Injectable, inject } from '@angular/core';
import { BRIDGE } from '../bridge/bridge.token';
import { writeLog } from '../errors/write-log';
import { GLOBAL_SCOPE, SHORTCUT_CONTEXT } from './command';
import { chordFromEvent, isSingleKey, isTextTarget, normalizeChord } from './key-chord';

const RESERVED_CHORD = 'Escape';

@Injectable({ providedIn: 'root' })
export class KeybindingService {
  private readonly bridge = inject(BRIDGE);
  private readonly context = inject(SHORTCUT_CONTEXT);
  private readonly bindings = new Map<string, string>();

  bind(scope: string, keys: string, commandId: string): boolean {
    const chord = normalizeChord(keys);
    const firstId = this.bindings.get(this.keyOf(scope, chord));
    if (chord === RESERVED_CHORD || firstId !== undefined) {
      const reason = chord === RESERVED_CHORD ? 'reserved' : `already bound to ${firstId}`;
      this.refuse(`Shortcut ${chord} in scope ${scope} refused for ${commandId}: ${reason}`);
      return false;
    }
    this.bindings.set(this.keyOf(scope, chord), commandId);
    return true;
  }

  unbind(scope: string, keys: string, commandId: string): void {
    const key = this.keyOf(scope, normalizeChord(keys));
    if (this.bindings.get(key) === commandId) {
      this.bindings.delete(key);
    }
  }

  resolve(event: KeyboardEvent): string | null {
    if (event.defaultPrevented || event.repeat) {
      return null;
    }
    const chord = chordFromEvent(event);
    if (chord === null || (isSingleKey(chord) && isTextTarget(event.target))) {
      return null;
    }
    return this.bindings.get(this.keyOf(this.context.activeScope(), chord)) ?? this.bindings.get(this.keyOf(GLOBAL_SCOPE, chord)) ?? null;
  }

  private keyOf(scope: string, chord: string): string {
    return `${scope}\u0000${chord}`;
  }

  private refuse(message: string): void {
    console.warn(message);
    writeLog(this.bridge, { level: 'warn', message });
  }
}
