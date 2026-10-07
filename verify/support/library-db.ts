import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, new URL('../../', import.meta.url)));

export const LIBRARY_DB = 'library.sqlite';
export const validMigrationsDir = fromRoot('verify/fixtures/migrations/valid');
export const failingMigrationsDir = fromRoot('verify/fixtures/migrations/failing');
const baseMigration = fromRoot('shared/src/data/migrations/0001_library.sql');

export type LibraryDbInfo = { journalMode: string; userVersion: number; tables: string[]; meta: Record<string, string> };

export const dbPath = (root: string): string => join(root, LIBRARY_DB);

export const sha256 = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');

const withDb = <T>(path: string, readOnly: boolean, run: (db: DatabaseSync) => T): T => {
  const db = new DatabaseSync(path, { readOnly });
  try {
    return run(db);
  } finally {
    db.close();
  }
};

const pragma = (db: DatabaseSync, name: string): Record<string, unknown> => db.prepare(`PRAGMA ${name}`).get() as Record<string, unknown>;

export const inspectLibrary = (root: string): LibraryDbInfo =>
  withDb(dbPath(root), true, (db) => {
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map(
      (row) => row.name,
    );
    const rows = tables.includes('library_meta')
      ? (db.prepare('SELECT key, value FROM library_meta').all() as { key: string; value: string }[])
      : [];
    return {
      journalMode: String(pragma(db, 'journal_mode').journal_mode),
      userVersion: Number(pragma(db, 'user_version').user_version),
      tables,
      meta: Object.fromEntries(rows.map((row) => [row.key, row.value])),
    };
  });

export const seedLibrary = (root: string, userVersion: number): string => {
  const path = dbPath(root);
  withDb(path, false, (db) => {
    db.exec(readFileSync(baseMigration, 'utf8'));
    db.exec(`PRAGMA user_version = ${userVersion}`);
  });
  return path;
};
