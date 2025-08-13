const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../../database/keyword-alchemist.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Access keys table
      this.db.run(`
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
      this.db.run(`
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
    });
  }

  // Create new access key
  createAccessKey(key, plan, credits, email = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO access_keys (key, credits_total, plan, email)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([key, credits, plan, email], function(err) {
        if (err) reject(err);
        else resolve({ key, credits, plan });
      });
      
      stmt.finalize();
    });
  }

  // Get access key info
  getAccessKey(key) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM access_keys WHERE key = ? AND status = 'active'
      `, [key], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Update credits usage
  useCredits(key, creditsUsed) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE access_keys 
        SET credits_used = credits_used + ? 
        WHERE key = ?
      `, [creditsUsed, key], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Log usage
  logUsage(accessKey, keywordsRequested, keywordsProcessed, creditsDeducted) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO usage_logs (access_key, keywords_requested, keywords_processed, credits_deducted)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([accessKey, keywordsRequested, keywordsProcessed, creditsDeducted], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      
      stmt.finalize();
    });
  }
}

module.exports = new Database();
