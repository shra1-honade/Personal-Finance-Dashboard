import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Single-file SQLite database. Path is configurable with DATABASE_PATH;
 * defaults to ./data/finance.db (git-ignored). Access tokens for linked
 * banks live here, so treat the file like a password.
 */
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "finance.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS plaid_items (
  item_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  cursor TEXT,
  last_synced_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES plaid_items(item_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  mask TEXT,
  source TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  pending INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  -- 1 when you re-categorized it by hand; syncs then keep your category.
  category_locked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
CREATE TABLE IF NOT EXISTS budgets (
  category TEXT PRIMARY KEY,
  limit_amount REAL NOT NULL
);
`;

const globalForDb = globalThis as unknown as { __financeDb?: Database.Database };

export function db(): Database.Database {
  if (!globalForDb.__financeDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const conn = new Database(DB_PATH);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    conn.exec(SCHEMA);
    globalForDb.__financeDb = conn;
  }
  return globalForDb.__financeDb;
}
