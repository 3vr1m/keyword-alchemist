#!/bin/bash

# Backend API Service Setup Script
# This script sets up the Node.js backend API service for the credit system

set -e

echo "🔧 Setting up Backend API Service..."
echo "======================================"

cd /opt/keyword-alchemist

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "📁 Creating backend directory..."
    mkdir -p backend
fi

cd backend

# Create package.json for the backend
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "keyword-alchemist-backend",
  "version": "1.0.0",
  "description": "Backend API for Keyword Alchemist credit system",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "@google/generative-ai": "^0.7.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create the server.js file
echo "🚀 Creating server.js..."
cat > server.js << 'EOF'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./credit_system.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS access_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_key TEXT UNIQUE NOT NULL,
    credits_total INTEGER NOT NULL,
    credits_remaining INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_key TEXT NOT NULL,
    keywords_processed INTEGER NOT NULL,
    credits_used INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API is running', timestamp: new Date().toISOString() });
});

// Validate access key endpoint
app.post('/api/auth/validate', (req, res) => {
  const { accessKey } = req.body;

  if (!accessKey) {
    return res.status(400).json({ error: 'Access key is required' });
  }

  db.get('SELECT * FROM access_keys WHERE access_key = ?', [accessKey], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid access key' });
    }

    res.json({
      valid: true,
      creditsTotal: row.credits_total,
      creditsRemaining: row.credits_remaining
    });
  });
});

// Process keywords endpoint
app.post('/api/keywords/process', async (req, res) => {
  const { accessKey, keywords } = req.body;

  if (!accessKey || !keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Access key and keywords array are required' });
  }

  // Validate access key and check credits
  db.get('SELECT * FROM access_keys WHERE access_key = ?', [accessKey], async (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid access key' });
    }

    if (row.credits_remaining < keywords.length) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        required: keywords.length,
        available: row.credits_remaining
      });
    }

    try {
      // Process keywords with AI
      const articles = [];
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      for (const keyword of keywords) {
        // Generate two versions for each keyword
        for (let version = 1; version <= 2; version++) {
          const prompt = `Create a comprehensive blog post about "${keyword}". 
          Version ${version === 1 ? 'Practical' : 'Analytical'}: 
          ${version === 1 ? 'Focus on practical, how-to content with step-by-step guidance.' : 'Focus on comprehensive analysis, trends, and expert insights.'}
          
          Please provide:
          1. A compelling title
          2. A brief TL;DR summary (2-3 sentences)
          3. A full article body in markdown format (800-1200 words)
          4. Include relevant headings, bullet points, and actionable advice
          
          Format your response as JSON:
          {
            "title": "Your title here",
            "tldr": "Your summary here",
            "body": "Your markdown content here"
          }`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          try {
            const articleData = JSON.parse(text);
            articles.push({
              title: articleData.title,
              tldr: articleData.tldr,
              body: articleData.body,
              keyword: keyword,
              approach: `Option ${version}`,
              linkingSuggestions: {
                context: `Optimize "${keyword}" content with strategic internal and external links.`,
                keyTerms: [keyword, `${keyword} guide`, `${keyword} tips`],
                sections: [`${keyword} best practices`, `${keyword} tools`, `${keyword} resources`]
              }
            });
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback article
            articles.push({
              title: `Complete Guide to ${keyword}`,
              tldr: `Learn everything about ${keyword} with this comprehensive guide covering key strategies and best practices.`,
              body: `# ${keyword} - Complete Guide\n\nThis comprehensive guide covers everything you need to know about ${keyword}.\n\n## Getting Started\n\nWhen working with ${keyword}, it's important to understand the fundamentals...\n\n## Best Practices\n\n- Research thoroughly\n- Plan your approach\n- Monitor results\n- Adjust as needed\n\n## Conclusion\n\nBy following these guidelines for ${keyword}, you'll be well on your way to success.`,
              keyword: keyword,
              approach: `Option ${version}`,
              linkingSuggestions: {
                context: `Optimize "${keyword}" content with strategic internal and external links.`,
                keyTerms: [keyword, `${keyword} guide`, `${keyword} tips`],
                sections: [`${keyword} best practices`, `${keyword} tools`, `${keyword} resources`]
              }
            });
          }
        }
      }

      // Deduct credits
      const creditsUsed = keywords.length;
      const newCreditsRemaining = row.credits_remaining - creditsUsed;

      db.run('UPDATE access_keys SET credits_remaining = ? WHERE access_key = ?', 
        [newCreditsRemaining, accessKey], (updateErr) => {
          if (updateErr) {
            console.error('Error updating credits:', updateErr);
            return res.status(500).json({ error: 'Failed to update credits' });
          }

          // Log usage
          db.run('INSERT INTO usage_logs (access_key, keywords_processed, credits_used) VALUES (?, ?, ?)',
            [accessKey, keywords.length, creditsUsed], (logErr) => {
              if (logErr) {
                console.error('Error logging usage:', logErr);
              }
            });

          res.json({
            articles: articles,
            creditsUsed: creditsUsed,
            creditsRemaining: newCreditsRemaining
          });
        });

    } catch (error) {
      console.error('Error processing keywords:', error);
      res.status(500).json({ error: 'Failed to process keywords' });
    }
  });
});

// Admin endpoint to create access keys (for testing)
app.post('/api/admin/create-key', (req, res) => {
  const { credits = 10 } = req.body;
  const accessKey = 'KWA-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  db.run('INSERT INTO access_keys (access_key, credits_total, credits_remaining) VALUES (?, ?, ?)',
    [accessKey, credits, credits], function(err) {
      if (err) {
        console.error('Error creating access key:', err);
        return res.status(500).json({ error: 'Failed to create access key' });
      }

      res.json({
        accessKey: accessKey,
        creditsTotal: credits,
        creditsRemaining: credits
      });
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('📊 Database connection closed');
    }
    process.exit(0);
  });
});
EOF

# Create .env file for backend
echo "🔐 Creating .env file..."
cat > .env << 'EOF'
PORT=3002
GEMINI_API_KEY=AIzaSyDY2uU3oWKPiT40d7g4CAQBlqbWmKueJGc
NODE_ENV=production
EOF

echo "📦 Installing dependencies..."
npm install

echo "✅ Backend setup completed!"
echo "======================================"
echo "To start the backend service:"
echo "cd /opt/keyword-alchemist/backend"
echo "npm start"
echo ""
echo "Test endpoints:"
echo "curl http://localhost:3002/api/health"
echo "curl -X POST http://localhost:3002/api/admin/create-key -H 'Content-Type: application/json' -d '{\"credits\": 10}'"
EOF
