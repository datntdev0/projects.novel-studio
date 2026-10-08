import { ModuleEntry, PanelSet, RailGroup } from './module-registry';

const NO_PANELS: PanelSet = { left: false, right: false, bottom: false };
const ALL_PANELS: PanelSet = { left: true, right: true, bottom: true };
const SIDE_PANELS: PanelSet = { left: true, right: true, bottom: false };
const LEFT_PANEL: PanelSet = { left: true, right: false, bottom: false };

function entry(
  id: string,
  group: RailGroup,
  scope: ModuleEntry['scope'],
  icon: string,
  moduleIds: string[],
  keywords: string,
  keys: string[],
  panels: PanelSet,
): ModuleEntry {
  return {
    id,
    group,
    scope,
    icon,
    labelKey: `module.${id}.label`,
    descriptionKey: `module.${id}.description`,
    moduleIds,
    keywords: keywords.split(' '),
    keys,
    panels,
    load: null,
  };
}

const HOME_ENTRY: ModuleEntry = entry(
  'home',
  'library',
  'library',
  'home',
  ['M01', 'M06'],
  'app shell first launch library folder',
  ['Ctrl+1'],
  NO_PANELS,
);

export const MODULE_ENTRIES: ModuleEntry[] = [
  HOME_ENTRY,
  entry('library', 'library', 'library', 'library', ['M04'], 'novel library import', ['Ctrl+2'], ALL_PANELS),
  entry('reader', 'workspace', 'novel', 'book', ['M05'], 'content reader chapter editor', ['Ctrl+3'], SIDE_PANELS),
  entry(
    'storyworld',
    'workspace',
    'novel',
    'network',
    ['M07', 'M08'],
    'omniscient story world graph catalog relationship map timeline entities',
    ['Ctrl+4'],
    ALL_PANELS,
  ),
  entry('translation', 'workspace', 'novel', 'globe', ['M09'], 'translation workspace quality review', ['Ctrl+5'], ALL_PANELS),
  entry('storychat', 'workspace', 'novel', 'message', ['M13'], 'story chat chatbot questions', [], NO_PANELS),
  entry('voicelab', 'media', 'library', 'mic', ['M14'], 'voice lab character casting audio clone', [], NO_PANELS),
  entry('pronunciation', 'media', 'library', 'pronounce', ['M15'], 'pronunciation dictionary audio tts', [], NO_PANELS),
  entry('assets', 'media', 'library', 'image', ['M10'], 'media asset library images voices', [], NO_PANELS),
  entry('sound', 'media', 'library', 'music', ['M16'], 'sound music ambience studio audio bgm sfx', [], NO_PANELS),
  entry(
    'audiobook',
    'production',
    'novel',
    'headphones',
    ['M11', 'M17'],
    'audiobook studio audio finishing mastering speech',
    [],
    NO_PANELS,
  ),
  entry('film', 'production', 'novel', 'film', ['M12'], 'film series studio episodes storyboard script', [], NO_PANELS),
  entry('videoeditor', 'production', 'novel', 'video', ['M18'], 'video editor render timeline assemble', [], NO_PANELS),
  entry('inbox', 'distribution', 'library', 'inbox', ['M19'], 'external media inbox download', [], NO_PANELS),
  entry('publishing', 'distribution', 'library', 'send', ['M20'], 'publishing channel hub release package', [], NO_PANELS),
  entry('tasks', 'system', 'app', 'tasks', ['M03'], 'task center jobs', ['Ctrl+6', 'Ctrl+Shift+T'], ALL_PANELS),
  entry(
    'settings',
    'system',
    'app',
    'settings',
    ['M02', 'M06', 'M21', 'M22'],
    'settings ai backends models integrations extensions system information diagnostics about export',
    ['Ctrl+7', 'Ctrl+,'],
    LEFT_PANEL,
  ),
];
