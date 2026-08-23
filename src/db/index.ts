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

const sqliteInstance = initDatabase();
export const db = drizzle(sqliteInstance, { schema });

