import { ModuleEntry } from './module-registry';

const PROBE_ENTRY: ModuleEntry = {
  id: 'probe',
  group: 'system',
  scope: 'library',
  icon: 'tasks',
  labelKey: 'module.probe.label',
  descriptionKey: 'module.probe.description',
  moduleIds: [],
  keywords: [],
  keys: [],
  panels: { left: true, right: true, bottom: true },
  load: () => import('../../../e2e/probe/probe.component').then((m) => m.ProbeComponent),
};

export const EXTRA_ENTRIES: ModuleEntry[] = new URLSearchParams(window.location.search).get('probe') === '1' ? [PROBE_ENTRY] : [];
