import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LIBRARY_DB_FILE, isNsError, nsError, type LibraryStatus, type NsError } from '@shared/core';
import { latestVersion, migrate, openDatabase, readUserVersion, type Database, type Migration } from '@shared/data';
import { writeFileAtomic } from '../fs/atomic-write';
import { log } from '../log';
import { resolveInLibrary } from './library-paths';

const CLOSED: LibraryStatus = { state: 'closed', root: null, version: null, libraryId: null, error: null };

let database: Database | null = null;
let root: string | null = null;
let status: LibraryStatus = CLOSED;

const toNsError = (error: unknown): NsError => (isNsError(error) ? error : nsError('INTERNAL', 'Library open failed', String(error)));

const insertMeta = (db: Database): void => {
  const meta = { library_id: randomUUID(), created_by_version: app.getVersion(), created_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(meta)) db.run('INSERT OR IGNORE INTO library_meta (key, value) VALUES (?, ?)', key, value);
};

const refuseNewerLibrary = (dbFile: string, migrations: Migration[]): void => {
  if (!existsSync(dbFile)) return;
  const current = readUserVersion(dbFile);
  const latest = latestVersion(migrations);
  if (current > latest) throw nsError('LIBRARY_NEWER_VERSION', 'Library was created by a newer version', `${current} > ${latest}`);
};

const prepareDatabase = (dbFile: string, migrations: Migration[]): Database => {
  refuseNewerLibrary(dbFile, migrations);
  const db = openDatabase(dbFile, { readOnly: false });
  try {
    migrate(db, migrations);
    insertMeta(db);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
};

export const closeLibrary = (): LibraryStatus => {
  if (database) {
    database.close();
    log.info('library closed');
  }
  database = null;
  root = null;
  status = CLOSED;
  return status;
};

const failOpen = (libraryRoot: string, error: unknown): never => {
  const nsErr = toNsError(error);
  status = { ...CLOSED, state: 'failed', root: libraryRoot, error: nsErr };
  log.error(`library open failed ${nsErr.code}${nsErr.code === 'LIBRARY_MIGRATION_FAILED' ? `\n${nsErr.detail ?? ''}` : ''}`);
  throw nsErr;
};

export const openLibrary = (libraryArg: string, loadMigrations: () => Migration[]): LibraryStatus => {
  closeLibrary();
  const libraryRoot = path.resolve(libraryArg);
  try {
    mkdirSync(libraryRoot, { recursive: true });
    database = prepareDatabase(path.join(libraryRoot, LIBRARY_DB_FILE), loadMigrations());
  } catch (error) {
    return failOpen(libraryRoot, error);
  }
  root = libraryRoot;
  const version = database.userVersion();
  const libraryId = database.get<{ value: string }>("SELECT value FROM library_meta WHERE key = 'library_id'")?.value ?? null;
  status = { state: 'open', root, version, libraryId, error: null };
  log.info(`library opened ${root} v${version}`);
  return status;
};

export const getLibraryStatus = (): LibraryStatus => status;

const openRoot = (): string => {
  if (!database || !root) throw nsError('LIBRARY_NOT_OPEN', 'No library is open');
  return root;
};

export const readLibraryText = (filePath: string): string | null => {
  const file = resolveInLibrary(openRoot(), filePath);
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
};

export const writeLibraryText = (filePath: string, text: string): void => {
  const file = resolveInLibrary(openRoot(), filePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileAtomic(file, text);
};
