import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nsError } from '../core/errors';
import type { Database } from './database';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

const MIGRATION_FILE = /^(\d{4})_(.+)\.sql$/;

export const readMigrationDir = (dir: string): Migration[] =>
  readdirSync(dir)
    .map((file) => ({ file, match: MIGRATION_FILE.exec(file) }))
    .filter((entry) => entry.match !== null)
    .map(({ file, match }) => ({
      version: Number(match![1]),
      name: file.replace(/\.sql$/, ''),
      sql: readFileSync(join(dir, file), 'utf8'),
    }))
    .sort((a, b) => a.version - b.version);

export const latestVersion = (migrations: Migration[]): number => {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1)
      throw nsError('INTERNAL', 'Migration versions must be unique and contiguous from 1', migration.name);
  });
  return migrations.length;
};

export const migrate = (db: Database, migrations: Migration[]): number => {
  const latest = latestVersion(migrations);
  const current = db.userVersion();
  if (current > latest) throw nsError('LIBRARY_NEWER_VERSION', 'Library was created by a newer version', `${current} > ${latest}`);
  if (current === latest) return current;
  let applying = '';
  try {
    db.transaction(() => {
      for (const migration of migrations.slice(current)) {
        applying = migration.name;
        db.exec(migration.sql);
        db.exec(`PRAGMA user_version = ${migration.version}`);
      }
    });
  } catch (error) {
    throw nsError(
      'LIBRARY_MIGRATION_FAILED',
      'Library migration failed',
      `${applying}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return latest;
};
