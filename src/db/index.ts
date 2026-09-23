import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import fs from 'fs';
import * as schema from './schema';

const DB_PATH = 'sqlite.db';

function initDatabase(): Database.Database {
  try {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    return sqlite;
  } catch (err) {
    console.error('Failed to open or initialize sqlite database, attempting recovery:', err);
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
      const sqlite = new Database(DB_PATH);
      sqlite.pragma('journal_mode = WAL');
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS transcripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          thumbnail TEXT NOT NULL,
          language TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      return sqlite;
    } catch (fatalErr) {
      console.error('Fallback in-memory sqlite initialization due to fatal error:', fatalErr);
      const sqlite = new Database(':memory:');
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS transcripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          thumbnail TEXT NOT NULL,
          language TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      return sqlite;
    }
  }
}

let db: any;
try {
  const sqliteInstance = initDatabase();
  if (sqliteInstance) {
    db = drizzle(sqliteInstance, { schema });
  } else {
    throw new Error('SQLite instance unavailable');
  }
} catch (e) {
  console.warn('[AI Studio] Database not connected — using in-memory mock');
  const inMemoryTranscripts: any[] = [];
  let nextId = 1;
  db = {
    select: () => ({
      from: () => ({
        where: (condition: any) => ({
          get: async () => {
            return inMemoryTranscripts.find((t) => (condition?.val ? t.videoId === condition.val : true)) || null;
          },
        }),
        orderBy: () => ({
          limit: async (n: number) => inMemoryTranscripts.slice(-n).reverse(),
        }),
      }),
    }),
    insert: () => ({
      values: (record: any) => ({
        returning: () => ({
          get: async () => {
            const item = { ...record, id: nextId++ };
            inMemoryTranscripts.push(item);
            return item;
          },
        }),
      }),
    }),
  };
}

export { db };

