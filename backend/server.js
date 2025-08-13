require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const database = require('./src/utils/database');
const keyGenerator = require('./src/utils/keyGenerator');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Keyword Alchemist API is running' });
});

// Validate access key
app.post('/api/auth/validate', async (req, res) => {
  try {
    const { accessKey } = req.body;
    
    if (!accessKey) {
      return res.status(400).json({ error: 'Access key is required' });
    }

    const keyData = await database.getAccessKey(accessKey);
    
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid access key' });
    }

    const creditsRemaining = keyData.credits_total - keyData.credits_used;
    
    res.json({
      valid: true,
      plan: keyData.plan,
      creditsTotal: keyData.credits_total,
      creditsUsed: keyData.credits_used,
      creditsRemaining,
      status: keyData.status
    });
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process keywords with credit validation
app.post('/api/keywords/process', async (req, res) => {
  try {
    const { accessKey, keywords } = req.body;
    
    if (!accessKey || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Access key and keywords array are required' });
    }

    // Validate access key
    const keyData = await database.getAccessKey(accessKey);
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid access key' });
    }

    const creditsRemaining = keyData.credits_total - keyData.credits_used;
    const keywordsRequested = keywords.length;
    
    // Check if enough credits
    if (creditsRemaining < keywordsRequested) {
      const allowedKeywords = keywords.slice(0, creditsRemaining);
      const rejectedKeywords = keywords.slice(creditsRemaining);
      
      return res.json({
        success: false,
        message: `Insufficient credits. ${creditsRemaining} credits remaining.`,
        creditsRemaining,
        allowedKeywords,
        rejectedKeywords
      });
    }

    // Return success for now (we'll integrate with Gemini later)
    res.json({
      success: true,
      message: 'Keywords ready for processing',
      creditsRemaining: creditsRemaining - keywordsRequested,
      keywordsToProcess: keywords
    });

  } catch (error) {
    console.error('Keyword processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Create access key (for testing)
app.post('/api/admin/create-key', async (req, res) => {
  try {
    const { plan = 'basic', email } = req.body;
    
    const credits = keyGenerator.getCreditsForPlan(plan);
    const accessKey = await keyGenerator.generateUniqueKey(database);
    
    await database.createAccessKey(accessKey, plan, credits, email);
    
    res.json({
      success: true,
      accessKey,
      plan,
      credits,
      message: 'Access key created successfully'
    });
  } catch (error) {
    console.error('Create key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Keyword Alchemist API running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
