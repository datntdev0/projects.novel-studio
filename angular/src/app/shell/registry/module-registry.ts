import { Type } from '@angular/core';
import { MODULE_ENTRIES } from './module-entries';
import { EXTRA_ENTRIES } from './extra-entries';

export type RailGroup = 'library' | 'workspace' | 'media' | 'production' | 'distribution' | 'system';
export interface PanelSet {
  left: boolean;
  right: boolean;
  bottom: boolean;
}
export interface ModuleEntry {
  id: string;
  group: RailGroup;
  scope: 'app' | 'library' | 'novel';
  icon: string;
  labelKey: string;
  descriptionKey: string;
  moduleIds: string[];
  keywords: string[];
  keys: string[];
  panels: PanelSet;
  load: (() => Promise<Type<unknown>>) | null;
}

export const MODULE_REGISTRY: ModuleEntry[] = [...MODULE_ENTRIES, ...EXTRA_ENTRIES];

export function findEntry(id: string): ModuleEntry | undefined {
  return MODULE_REGISTRY.find((entry) => entry.id === id);
}

export const RAIL_GROUPS: RailGroup[] = ['library', 'workspace', 'media', 'production', 'distribution', 'system'];

export const groupEntries = (entries: ModuleEntry[], group: RailGroup, novelOpen: boolean): ModuleEntry[] =>
  entries.filter((entry) => entry.group === group && (entry.scope !== 'novel' || novelOpen));
