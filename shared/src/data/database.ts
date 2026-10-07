import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

export interface Database {
  exec(sql: string): void;
  get<T>(sql: string, ...params: SQLInputValue[]): T | undefined;
  all<T>(sql: string, ...params: SQLInputValue[]): T[];
  run(sql: string, ...params: SQLInputValue[]): void;
  transaction<T>(body: () => T): T;
  userVersion(): number;
  close(): void;
}

let warningHandlerInstalled = false;

export const setSqliteWarningHandler = (handler: (text: string) => void): void => {
  if (warningHandlerInstalled) return;
  warningHandlerInstalled = true;
  const original = process.emitWarning;
  let reported = false;
  process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    const message = typeof warning === 'string' ? warning : warning.message;
    const type = typeof warning === 'string' ? args[0] : warning.name;
    const isSqlite = type === 'ExperimentalWarning' && message.includes('SQLite');
    if (!isSqlite) return (original as (...all: unknown[]) => void).call(process, warning, ...args);
    if (!reported) handler(message);
    reported = true;
  }) as typeof process.emitWarning;
};

const wrap = (db: DatabaseSync): Database => {
  const database: Database = {
    exec: (sql) => db.exec(sql),
    get: <T>(sql: string, ...params: SQLInputValue[]) => db.prepare(sql).get(...params) as T | undefined,
    all: <T>(sql: string, ...params: SQLInputValue[]) => db.prepare(sql).all(...params) as T[],
    run: (sql, ...params) => {
      db.prepare(sql).run(...params);
    },
    transaction: <T>(body: () => T): T => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = body();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        if (db.isTransaction) db.exec('ROLLBACK');
        throw error;
      }
    },
    userVersion: () => database.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0,
    close: () => db.close(),
  };
  return database;
};

export const openDatabase = (file: string, options: { readOnly: boolean }): Database => {
  const sqlite = process.getBuiltinModule('node:sqlite');
  const db = new sqlite.DatabaseSync(file, { readOnly: options.readOnly });
  try {
    if (!options.readOnly) db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  } catch (error) {
    db.close();
    throw error;
  }
  return wrap(db);
};

export const readUserVersion = (file: string): number => {
  const db = openDatabase(file, { readOnly: true });
  try {
    return db.userVersion();
  } finally {
    db.close();
  }
};
