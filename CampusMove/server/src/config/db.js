import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;
let isPostgres = false;

// Check if PostgreSQL DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.trim() !== '') {
  // Use pg (PostgreSQL on Neon / Cloud)
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('[DB] Connected to PostgreSQL via DATABASE_URL');
    isPostgres = true;

    dbInstance = {
      isPostgres: true,
      query: async (text, params = []) => {
        const client = await pool.connect();
        try {
          const res = await client.query(text, params);
          return res;
        } finally {
          client.release();
        }
      },
      close: async () => {
        await pool.end();
      }
    };
  } catch (err) {
    console.error('[DB] Failed to initialize PostgreSQL pool:', err.message);
    throw err;
  }
} else {
  // Use Node.js 24 built-in native SQLite engine
  const { DatabaseSync } = await import('node:sqlite');
  const dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'campusmove.sqlite');
  console.log(`[DB] Running on built-in native SQLite engine at: ${dbPath}`);
  
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec('PRAGMA foreign_keys = ON;');
  sqlite.exec('PRAGMA journal_mode = WAL;');

  isPostgres = false;

  dbInstance = {
    isPostgres: false,
    query: async (text, params = []) => {
      // Normalize parameter placeholders: convert $1, $2, ... to ?
      let querySql = text.replace(/\$(\d+)/g, '?');

      // SQLite handles BOOLEAN as INTEGER (0 or 1). Convert booleans in params
      const sanitizedParams = params.map(val => {
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
      });

      const trimmed = text.trim();
      const isSelect = /^SELECT\b/i.test(trimmed) || /^PRAGMA\b/i.test(trimmed) || /\bRETURNING\b/i.test(trimmed);

      try {
        const stmt = sqlite.prepare(querySql);
        if (isSelect) {
          const rows = stmt.all(...sanitizedParams);
          return { rows, rowCount: rows.length };
        } else {
          const info = stmt.run(...sanitizedParams);
          return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
        }
      } catch (err) {
        console.error(`[DB SQLite Error] in query: "${querySql}"`, err);
        throw err;
      }
    },
    exec: (sql) => {
      return sqlite.exec(sql);
    },
    close: async () => {
      sqlite.close();
    }
  };
}

export default dbInstance;
export { isPostgres };
