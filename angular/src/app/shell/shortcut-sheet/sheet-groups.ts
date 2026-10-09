import { translate, type Language } from '@shared/core';
import { normalizeChord } from '../../core/shortcuts/key-chord';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import type { ModuleEntry } from '../registry/module-registry';

export interface SheetRow {
  testId: string;
  label: string;
  keys: string[];
  active: boolean;
}

export interface SheetGroup {
  scope: string;
  title: string;
  here: boolean;
  rows: SheetRow[];
}

const keyedCommands = (commands: Command[], scope: string): Command[] =>
  commands.filter((command) => command.scope === scope && command.keys.length > 0);

const toRow = (command: Command, language: Language, active: boolean): SheetRow => ({
  testId: `shortcuts-row-${command.id}`,
  label: translate(language, command.labelKey),
  keys: command.keys,
  active,
});

export function buildSheetGroups(commands: Command[], modules: ModuleEntry[], activeScope: string, language: Language): SheetGroup[] {
  const shadowed = keyedCommands(commands, activeScope).flatMap((command) => command.keys.map(normalizeChord));
  const globalRows = keyedCommands(commands, GLOBAL_SCOPE).map((command) =>
    toRow(command, language, !command.keys.every((key) => shadowed.includes(normalizeChord(key)))),
  );
  const escapeRow: SheetRow = {
    testId: 'shortcuts-row-escape',
    label: translate(language, 'shortcuts.escape'),
    keys: ['Escape'],
    active: true,
  };
  const globalGroup: SheetGroup = {
    scope: GLOBAL_SCOPE,
    title: translate(language, 'shortcuts.global'),
    here: false,
    rows: [...globalRows, escapeRow],
  };
  const moduleGroups = modules
    .map((entry) => ({
      scope: entry.id,
      title: translate(language, entry.labelKey),
      here: entry.id === activeScope,
      rows: keyedCommands(commands, entry.id).map((command) => toRow(command, language, entry.id === activeScope)),
    }))
    .filter((group) => group.rows.length > 0);
  return [globalGroup, ...moduleGroups];
}
