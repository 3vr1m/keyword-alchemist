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
        output_format TEXT DEFAULT 'wordpress',
        estimated_cost_usd REAL DEFAULT 0.0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (access_key) REFERENCES access_keys (key)
      )
    `);
    
    // Keyword analytics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS keyword_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_key TEXT NOT NULL,
        keyword TEXT NOT NULL,
        approach TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
        error_message TEXT,
        word_count INTEGER,
        processing_time_ms INTEGER,
        output_format TEXT DEFAULT 'wordpress',
        estimated_cost_usd REAL DEFAULT 0.0,
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
      console.log(`[DB] Updating credits for key: ${key}, deducting: ${creditsUsed}`);
      
      const stmt = this.db.prepare(`
        UPDATE access_keys 
        SET credits_used = credits_used + ? 
        WHERE key = ?
      `);
      
      const result = stmt.run(creditsUsed, key);
      console.log(`[DB] Update result:`, result);
      
      if (result.changes === 0) {
        console.error(`[DB] No rows updated for key: ${key}`);
        return Promise.reject(new Error('No rows updated'));
      }
      
      return Promise.resolve(result.changes);
    } catch (error) {
      console.error(`[DB] Error updating credits:`, error);
      return Promise.reject(error);
    }
  }

  // Log usage
  logUsage(accessKey, keywordsRequested, keywordsProcessed, creditsDeducted, outputFormat = 'wordpress', estimatedCost = 0.0) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO usage_logs (access_key, keywords_requested, keywords_processed, credits_deducted, output_format, estimated_cost_usd)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(accessKey, keywordsRequested, keywordsProcessed, creditsDeducted, outputFormat, estimatedCost);
      return Promise.resolve(result.lastInsertRowid);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Log successful keyword generation
  logSuccessfulKeyword(accessKey, keyword, approach, wordCount, processingTimeMs, outputFormat = 'wordpress', estimatedCost = 0.0) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO keyword_analytics (access_key, keyword, approach, status, word_count, processing_time_ms, output_format, estimated_cost_usd)
        VALUES (?, ?, ?, 'success', ?, ?, ?, ?)
      `);
      
      const result = stmt.run(accessKey, keyword, approach, wordCount, processingTimeMs, outputFormat, estimatedCost);
      return Promise.resolve(result.lastInsertRowid);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Log failed keyword generation
  logFailedKeyword(accessKey, keyword, approach, errorMessage, outputFormat = 'wordpress') {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO keyword_analytics (access_key, keyword, approach, status, error_message, output_format)
        VALUES (?, ?, ?, 'failed', ?, ?)
      `);
      
      const result = stmt.run(accessKey, keyword, approach, errorMessage, outputFormat);
      return Promise.resolve(result.lastInsertRowid);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Get admin dashboard analytics
  getAdminAnalytics() {
    try {
      // Total stats
      const totalKeys = this.db.prepare('SELECT COUNT(*) as count FROM access_keys').get().count;
      const totalRequests = this.db.prepare('SELECT COUNT(*) as count FROM usage_logs').get().count;
      const totalKeywordAttempts = this.db.prepare('SELECT COUNT(*) as count FROM keyword_analytics').get().count;
      const successfulKeywords = this.db.prepare('SELECT COUNT(*) as count FROM keyword_analytics WHERE status = \'success\'').get().count;
      const failedKeywords = this.db.prepare('SELECT COUNT(*) as count FROM keyword_analytics WHERE status = \'failed\'').get().count;
      
      // API call counts and cost estimation
      const totalCreditsUsed = this.db.prepare('SELECT COALESCE(SUM(credits_deducted), 0) as total FROM usage_logs').get().total;
      const totalEstimatedCost = this.db.prepare('SELECT COALESCE(SUM(estimated_cost_usd), 0) as total FROM usage_logs').get().total +
                                this.db.prepare('SELECT COALESCE(SUM(estimated_cost_usd), 0) as total FROM keyword_analytics').get().total;
      
      // Output format statistics
      const formatStats = this.db.prepare(`
        SELECT output_format, COUNT(*) as count
        FROM usage_logs
        GROUP BY output_format
        ORDER BY count DESC
      `).all();
      
      // Recent failures (last 48 hours)
      const recentFailures = this.db.prepare(`
        SELECT keyword, approach, error_message, timestamp, access_key 
        FROM keyword_analytics 
        WHERE status = 'failed' AND timestamp > datetime('now', '-48 hours')
        ORDER BY timestamp DESC
        LIMIT 50
      `).all();
      
      // Most popular keywords
      const popularKeywords = this.db.prepare(`
        SELECT keyword, COUNT(*) as usage_count, 
               SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failure_count
        FROM keyword_analytics 
        GROUP BY keyword 
        ORDER BY usage_count DESC 
        LIMIT 20
      `).all();
      
      // Most used keywords (successful only)
      const mostUsedKeywords = this.db.prepare(`
        SELECT keyword, COUNT(*) as usage_count
        FROM keyword_analytics 
        WHERE status = 'success'
        GROUP BY keyword 
        ORDER BY usage_count DESC 
        LIMIT 15
      `).all();
      
      // Daily stats for the last 7 days
      const dailyStats = this.db.prepare(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM keyword_analytics 
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `).all();
      
      // Revenue and usage stats
      const revenueStats = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT access_key) as active_api_keys,
          SUM(keywords_requested) as total_keywords_requested,
          SUM(keywords_processed) as total_keywords_processed,
          SUM(credits_deducted) as total_credits_consumed,
          AVG(credits_deducted) as avg_credits_per_request
        FROM usage_logs
      `).get();
      
      return Promise.resolve({
        summary: {
          totalKeys,
          totalRequests,
          totalKeywordAttempts,
          successfulKeywords,
          failedKeywords,
          successRate: totalKeywordAttempts > 0 ? ((successfulKeywords / totalKeywordAttempts) * 100).toFixed(1) : 0,
          totalCreditsUsed,
          totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(4))
        },
        formatStats,
        revenueStats: {
          ...revenueStats,
          avg_credits_per_request: parseFloat(revenueStats.avg_credits_per_request || 0).toFixed(2)
        },
        recentFailures,
        popularKeywords,
        mostUsedKeywords,
        dailyStats
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = new DatabaseManager();
