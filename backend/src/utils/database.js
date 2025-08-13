const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../database/keyword-alchemist.db'));
    this.init();
  }

  init() {
    // Access keys table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS access_keys (
        key TEXT PRIMARY KEY,
        credits_total INTEGER NOT NULL,
        credits_used INTEGER DEFAULT 0,
        plan TEXT NOT NULL CHECK (plan IN ('basic', 'blogger', 'pro')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        email TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired'))
      )
    `);

    // Usage logs table (for analytics)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT NOT NULL,
        keywords_requested INTEGER NOT NULL,
        keywords_processed INTEGER NOT NULL,
        credits_deducted INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (access_key) REFERENCES access_keys (key)
      )
    `);
  }

  // Create new access key
  createAccessKey(key, plan, credits, email = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO access_keys (key, credits_total, plan, email)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(key, credits, plan, email);
      return Promise.resolve({ key, credits, plan });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Get access key info
  getAccessKey(key) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM access_keys WHERE key = ? AND status = 'active'
      `);
      
      const row = stmt.get(key);
      return Promise.resolve(row);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Update credits usage
  useCredits(key, creditsUsed) {
    try {
      const stmt = this.db.prepare(`
        UPDATE access_keys 
        SET credits_used = credits_used + ? 
        WHERE key = ?
      `);
      
      const result = stmt.run(creditsUsed, key);
      return Promise.resolve(result.changes);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Log usage
  logUsage(accessKey, keywordsRequested, keywordsProcessed, creditsDeducted) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO usage_logs (access_key, keywords_requested, keywords_processed, credits_deducted)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(accessKey, keywordsRequested, keywordsProcessed, creditsDeducted);
      return Promise.resolve(result.lastInsertRowid);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = new DatabaseManager();
