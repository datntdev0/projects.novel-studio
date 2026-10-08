const IGNORED_KEYS = ['Control', 'Alt', 'Shift', 'Meta', 'Dead', 'Process', 'Unidentified'];
const NON_TEXT_INPUT_TYPES = ['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit'];

function isLetter(key: string): boolean {
  return key.length === 1 && key.toLowerCase() !== key.toUpperCase();
}

function buildChord(ctrl: boolean, alt: boolean, shift: boolean, key: string): string {
  const parts = [ctrl ? 'Ctrl' : '', alt ? 'Alt' : '', shift ? 'Shift' : '', isLetter(key) ? key.toUpperCase() : key];
  return parts.filter((part) => part !== '').join('+');
}

export function normalizeChord(text: string): string {
  const [, modifiers, key] = /^((?:(?:ctrl|alt|shift)\+)*)(.+)$/i.exec(text.trim()) ?? ['', '', text.trim()];
  const lower = modifiers.toLowerCase();
  return buildChord(lower.includes('ctrl'), lower.includes('alt'), lower.includes('shift'), key);
}

export function chordFromEvent(event: KeyboardEvent): string | null {
  if (IGNORED_KEYS.includes(event.key)) return null;
  const withShift = event.shiftKey && (isLetter(event.key) || event.key.length > 1);
  return buildChord(event.ctrlKey, event.altKey, withShift, event.key);
}

export function isSingleKey(chord: string): boolean {
  return !/^(Ctrl|Alt)\+/.test(chord);
}

export function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
}
