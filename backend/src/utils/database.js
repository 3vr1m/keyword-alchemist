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
    
    // Payment logs table (for Stripe webhook tracking)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE,
        access_key TEXT,
        plan TEXT NOT NULL,
        credits INTEGER NOT NULL,
        amount_paid INTEGER NOT NULL,
        customer_email TEXT,
        stripe_customer_id TEXT,
        payment_status TEXT NOT NULL CHECK (payment_status IN ('completed', 'failed', 'pending')),
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (access_key) REFERENCES access_keys (key)
      )
    `);
    
    // Migration: Add missing columns if they don't exist
    this.runMigrations();
  }

  runMigrations() {
    try {
      // Check if estimated_cost_usd column exists in usage_logs
      const usageLogsColumns = this.db.prepare("PRAGMA table_info(usage_logs)").all();
      const hasEstimatedCostInUsageLogs = usageLogsColumns.some(col => col.name === 'estimated_cost_usd');
      const hasOutputFormatInUsageLogs = usageLogsColumns.some(col => col.name === 'output_format');
      
      if (!hasEstimatedCostInUsageLogs) {
        this.db.exec('ALTER TABLE usage_logs ADD COLUMN estimated_cost_usd REAL DEFAULT 0.0');
        console.log('Added estimated_cost_usd column to usage_logs table');
      }
      
      if (!hasOutputFormatInUsageLogs) {
        this.db.exec("ALTER TABLE usage_logs ADD COLUMN output_format TEXT DEFAULT 'wordpress'");
        console.log('Added output_format column to usage_logs table');
      }
      
      // Check if columns exist in keyword_analytics
      const keywordAnalyticsColumns = this.db.prepare("PRAGMA table_info(keyword_analytics)").all();
      const hasEstimatedCostInKeywordAnalytics = keywordAnalyticsColumns.some(col => col.name === 'estimated_cost_usd');
      const hasOutputFormatInKeywordAnalytics = keywordAnalyticsColumns.some(col => col.name === 'output_format');
      const hasWordCountInKeywordAnalytics = keywordAnalyticsColumns.some(col => col.name === 'word_count');
      const hasProcessingTimeInKeywordAnalytics = keywordAnalyticsColumns.some(col => col.name === 'processing_time_ms');
      
      if (!hasEstimatedCostInKeywordAnalytics) {
        this.db.exec('ALTER TABLE keyword_analytics ADD COLUMN estimated_cost_usd REAL DEFAULT 0.0');
        console.log('Added estimated_cost_usd column to keyword_analytics table');
      }
      
      if (!hasOutputFormatInKeywordAnalytics) {
        this.db.exec("ALTER TABLE keyword_analytics ADD COLUMN output_format TEXT DEFAULT 'wordpress'");
        console.log('Added output_format column to keyword_analytics table');
      }
      
      if (!hasWordCountInKeywordAnalytics) {
        this.db.exec('ALTER TABLE keyword_analytics ADD COLUMN word_count INTEGER');
        console.log('Added word_count column to keyword_analytics table');
      }
      
      if (!hasProcessingTimeInKeywordAnalytics) {
        this.db.exec('ALTER TABLE keyword_analytics ADD COLUMN processing_time_ms INTEGER');
        console.log('Added processing_time_ms column to keyword_analytics table');
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
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

  // Clear all analytics data (preserves structure)
  clearAnalyticsData() {
    try {
      // Clear usage logs
      this.db.exec('DELETE FROM usage_logs');
      // Clear keyword analytics
      this.db.exec('DELETE FROM keyword_analytics');
      // Reset any auto-increment counters (only if sqlite_sequence table exists)
      try {
        this.db.exec("DELETE FROM sqlite_sequence WHERE name IN ('usage_logs', 'keyword_analytics')");
      } catch (seqError) {
        // sqlite_sequence might not exist if no auto-increment was used yet
        console.log('Note: sqlite_sequence table not found or empty, skipping counter reset');
      }
      
      console.log('Analytics data cleared successfully');
      return Promise.resolve({ cleared: true });
    } catch (error) {
      console.error('Error clearing analytics data:', error);
      return Promise.reject(error);
    }
  }

  // Delete all access keys
  deleteAllKeys() {
    try {
      this.db.exec('DELETE FROM access_keys');
      console.log('All access keys deleted successfully');
      return Promise.resolve({ deleted: true });
    } catch (error) {
      console.error('Error deleting access keys:', error);
      return Promise.reject(error);
    }
  }

  // Get all access keys (admin function)
  getAllKeys() {
    try {
      const stmt = this.db.prepare(`
        SELECT key, plan, credits_total, credits_used, email, status, created_at,
               (credits_total - credits_used) as credits_remaining
        FROM access_keys 
        ORDER BY created_at DESC
      `);
      
      const keys = stmt.all();
      return Promise.resolve(keys);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Log payment transaction
  logPayment(paymentData) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO payment_logs 
        (session_id, access_key, plan, credits, amount_paid, customer_email, stripe_customer_id, payment_status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        paymentData.sessionId,
        paymentData.accessKey || null,
        paymentData.plan,
        paymentData.credits,
        paymentData.amountPaid,
        paymentData.customerEmail,
        paymentData.stripeCustomerId || null,
        paymentData.paymentStatus,
        paymentData.errorMessage || null
      );
      
      return Promise.resolve(result.lastInsertRowid);
    } catch (error) {
      console.error('Error logging payment:', error);
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
      
      // Payment stats
      const totalPayments = this.db.prepare('SELECT COUNT(*) as count FROM payment_logs WHERE payment_status = \'completed\'').get().count;
      const totalRevenue = this.db.prepare('SELECT COALESCE(SUM(amount_paid), 0) as total FROM payment_logs WHERE payment_status = \'completed\'').get().total;
      const failedPayments = this.db.prepare('SELECT COUNT(*) as count FROM payment_logs WHERE payment_status = \'failed\'').get().count;
      
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
      
      // Recent payments (last 48 hours)
      const recentPayments = this.db.prepare(`
        SELECT session_id, plan, credits, amount_paid, customer_email, payment_status, created_at
        FROM payment_logs 
        WHERE created_at > datetime('now', '-48 hours')
        ORDER BY created_at DESC
        LIMIT 20
      `).all();
      
      // Plan distribution from payments
      const planDistribution = this.db.prepare(`
        SELECT plan, COUNT(*) as count, SUM(amount_paid) as revenue
        FROM payment_logs 
        WHERE payment_status = 'completed'
        GROUP BY plan
        ORDER BY count DESC
      `).all();

      return Promise.resolve({
        summary: {
          totalKeys,
          totalRequests,
          totalKeywordAttempts,
          successfulKeywords,
          failedKeywords,
          successRate: totalKeywordAttempts > 0 ? ((successfulKeywords / totalKeywordAttempts) * 100).toFixed(1) : 0,
          totalCreditsUsed,
          totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(4)),
          totalPayments,
          totalRevenue: totalRevenue / 100, // Convert cents to dollars
          failedPayments
        },
        formatStats,
        revenueStats: {
          ...revenueStats,
          avg_credits_per_request: parseFloat(revenueStats.avg_credits_per_request || 0).toFixed(2)
        },
        recentFailures,
        popularKeywords,
        mostUsedKeywords,
        dailyStats,
        recentPayments,
        planDistribution
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = new DatabaseManager();
