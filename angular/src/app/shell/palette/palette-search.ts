import { translate, type Language, type NovelSummary } from '@shared/core';
import { GLOBAL_SCOPE, type Command } from '../../core/shortcuts/command';
import { navCommandId } from '../commands/navigation.commands';
import { groupEntries, RAIL_GROUPS, type ModuleEntry } from '../registry/module-registry';

export type PaletteFilter = 'all' | 'novels';
export type PaletteAction = { kind: 'command'; id: string } | { kind: 'novel'; id: string };

export interface PaletteItem {
  testId: string;
  icon: string;
  label: string;
  hint: string;
  keys: string[];
  terms: string;
  action: PaletteAction;
}

export interface PaletteSection {
  id: string;
  title: string;
  items: PaletteItem[];
}

export interface PaletteSource {
  modules: ModuleEntry[];
  commands: Command[];
  novels: NovelSummary[];
  novelOpen: boolean;
  activeScope: string;
  filter: PaletteFilter;
}

export const PALETTE_COMMAND_ID = 'overlay.palette';

export const commandKeys = (commands: Command[], id: string): string[] => commands.find((command) => command.id === id)?.keys ?? [];

export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');
}

const buildTerms = (labelKey: string, extra: string[]): string =>
  normalizeSearch([translate('en', labelKey), translate('vi', labelKey), ...extra].join(' '));

function moduleSections(source: PaletteSource, language: Language): PaletteSection[] {
  return RAIL_GROUPS.map((group) => ({
    id: `module-${group}`,
    title: translate(language, 'palette.module', { group: translate(language, `rail.group.${group}`) }),
    items: groupEntries(source.modules, group, source.novelOpen).map((entry) => ({
      testId: `palette-module-${entry.id}`,
      icon: entry.icon,
      label: translate(language, entry.labelKey),
      hint: entry.moduleIds.join(' · '),
      keys: commandKeys(source.commands, navCommandId(entry.id)),
      terms: buildTerms(entry.labelKey, [...entry.keywords, ...entry.moduleIds]),
      action: { kind: 'command', id: navCommandId(entry.id) },
    })),
  }));
}

function commandSection(source: PaletteSource, language: Language): PaletteSection {
  const navIds = source.modules.map((entry) => navCommandId(entry.id));
  return {
    id: 'commands',
    title: translate(language, 'palette.commands'),
    items: source.commands
      .filter((command) => !navIds.includes(command.id) && command.id !== PALETTE_COMMAND_ID)
      .filter((command) => command.scope === GLOBAL_SCOPE || command.scope === source.activeScope)
      .filter((command) => !command.needsNovel || source.novelOpen)
      .map((command) => ({
        testId: `palette-cmd-${command.id}`,
        icon: 'command',
        label: translate(language, command.labelKey),
        hint: '',
        keys: command.keys,
        terms: buildTerms(command.labelKey, command.keywords),
        action: { kind: 'command', id: command.id },
      })),
  };
}

function novelSection(source: PaletteSource, language: Language): PaletteSection {
  return {
    id: 'novels',
    title: translate(language, 'palette.novels'),
    items: source.novels.map((novel) => ({
      testId: `palette-novel-${novel.id}`,
      icon: 'book',
      label: novel.title,
      hint: '',
      keys: [],
      terms: normalizeSearch(novel.title),
      action: { kind: 'novel', id: novel.id },
    })),
  };
}

export function buildSections(source: PaletteSource, language: Language): PaletteSection[] {
  const sections =
    source.filter === 'novels'
      ? [novelSection(source, language)]
      : [...moduleSections(source, language), commandSection(source, language), novelSection(source, language)];
  return sections.filter((section) => section.items.length > 0);
}

export function filterSections(sections: PaletteSection[], query: string): PaletteSection[] {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => tokens.every((token) => item.terms.includes(token))) }))
    .filter((section) => section.items.length > 0);
}
