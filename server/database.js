import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'estela.db');
const db = new sqlite3.Database(dbPath);

// Promisified query helper
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function initDatabase() {
  await run(`PRAGMA foreign_keys = ON;`);

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      medical_info TEXT,
      emergency_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trusted Contacts Table
  await run(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT CHECK(role IN ('primary', 'backup', 'general')) DEFAULT 'general',
      notify_on_missed_checkin INTEGER DEFAULT 1,
      notify_on_sos INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Safety Sessions Table
  await run(`
    CREATE TABLE IF NOT EXISTS safety_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'completed', 'overdue', 'cancelled')) DEFAULT 'active',
      duration_minutes INTEGER NOT NULL,
      checkin_interval_minutes INTEGER NOT NULL,
      location_sharing_enabled INTEGER DEFAULT 1,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      next_checkin_deadline DATETIME NOT NULL,
      ended_at DATETIME,
      primary_contact_id TEXT,
      backup_contact_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Check-ins Table
  await run(`
    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('safe', 'missed', 'escalated')) DEFAULT 'safe',
      checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      FOREIGN KEY (session_id) REFERENCES safety_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Incidents Table (SOS & Escalations)
  await run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      type TEXT CHECK(type IN ('SOS', 'MISSED_CHECKIN', 'AI_DISTRESS')) NOT NULL,
      status TEXT CHECK(status IN ('ACTIVE', 'RESOLVED', 'CANCELLED')) DEFAULT 'ACTIVE',
      severity TEXT CHECK(severity IN ('HIGH', 'CRITICAL', 'MEDIUM')) DEFAULT 'CRITICAL',
      trigger_source TEXT,
      distress_phrase TEXT,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      address_approx TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolution_note TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Location Snapshots
  await run(`
    CREATE TABLE IF NOT EXISTS location_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      incident_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notification Delivery Events
  await run(`
    CREATE TABLE IF NOT EXISTS notification_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      incident_id TEXT,
      contact_id TEXT,
      channel TEXT CHECK(channel IN ('EMAIL', 'SMS', 'PUSH', 'SIMULATED_DISPATCH')) NOT NULL,
      recipient_target TEXT NOT NULL,
      subject TEXT,
      message_body TEXT NOT NULL,
      status TEXT CHECK(status IN ('SENT', 'FAILED', 'ACKNOWLEDGED', 'QUEUED')) DEFAULT 'SENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✓ SQLite Database initialized successfully with all tables');
}

export default db;
