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

// Process keywords with credit validation and blog generation
app.post('/api/keywords/process', async (req, res) => {
  try {
    const { accessKey, keywords, format = 'wordpress' } = req.body;
    
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
    
    // Check if enough credits (but don't deduct yet)
    if (creditsRemaining < keywordsRequested) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: keywordsRequested,
        available: creditsRemaining,
        creditsRemaining
      });
    }

    // Initialize Gemini AI if not already done
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    console.log(`[AI] Starting blog generation for ${keywords.length} keywords...`);
    
    const articles = [];
    let successfulGenerations = 0;
    
    try {
      // Process each keyword and generate 2 articles (Option 1 and Option 2)
      for (const keyword of keywords) {
        console.log(`[AI] Generating content for keyword: ${keyword}`);
        
        // Generate two different approaches for each keyword
        for (let version = 1; version <= 2; version++) {
          const approachHint = version === 1 
            ? 'Focus on practical, how-to content with step-by-step guidance.'
            : 'Focus on comprehensive analysis, trends, and expert insights.';
          
          const prompt = `You are an expert blog post writer and SEO specialist. Your task is to create a high-quality, well-researched, and engaging blog post based on the given keyword.

**Keyword:** ${keyword}
**Special Focus:** ${approachHint}

**Instructions:**
1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words.
2. **Deep Research:** Provide fresh, insightful, and factual information.
3. **WordPress Formatting (Markdown):** Use clean, standard Markdown.
   * Use H2 headings (\`## Subheading\`) for main sections
   * Use bullet points (\`* \`) or numbered lists (\`1. \`) for lists
   * Use bold text (\`**text**\`) to emphasize key phrases
   * **NO LINKS:** Do not include any hyperlinks or URLs
4. **Structure:**
   * **Title:** Create a catchy, SEO-friendly title
   * **TLDR:** Write a concise 2-3 sentence summary
   * **Body:** Start with compelling introduction, develop main points, end with strong conclusion

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your SEO-friendly title here",
  "tldr": "Your 2-3 sentence summary here",
  "body": "Your 400+ word markdown-formatted blog post body here"
}`;

          const startTime = Date.now();
          try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`[AI] Generated content for ${keyword} (Option ${version}), parsing...`);
            
            // Parse the JSON response
            let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            
            // If that doesn't work, try to find JSON within the text
            if (!cleanedText.startsWith('{')) {
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                cleanedText = jsonMatch[0];
              }
            }
            
            const articleData = JSON.parse(cleanedText);
            
            // Validate the response structure
            if (!articleData.title || !articleData.tldr || !articleData.body) {
              throw new Error('Invalid response structure from Gemini API');
            }
            
            // Ensure minimum word count
            const wordCount = articleData.body.split(/\s+/).length;
            if (wordCount < 400) {
              throw new Error(`Blog post body is too short (${wordCount} words). Minimum 400 words required.`);
            }
            
            const processingTime = Date.now() - startTime;
            
            // Calculate estimated cost based on word count and processing complexity
            const estimatedCost = (wordCount / 1000) * 0.002; // $0.002 per 1000 words as base cost
            
            // Log successful keyword generation for analytics
            await database.logSuccessfulKeyword(accessKey, keyword, `Option ${version}`, wordCount, processingTime, format, estimatedCost);
            
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
            
            successfulGenerations++;
            console.log(`[AI] Successfully generated Option ${version} for "${keyword}" (${wordCount} words, ${processingTime}ms)`);
            
            // Small delay between generations to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (parseError) {
            console.error(`[AI] Error generating content for ${keyword} (Option ${version}):`, parseError);
            
            // Log failed keyword for analytics
            await database.logFailedKeyword(accessKey, keyword, `Option ${version}`, parseError.message);
            
            // Don't add fallback - let it fail properly
            throw new Error(`Failed to generate ${version === 1 ? 'practical' : 'analytical'} content for "${keyword}": ${parseError.message}`);
          }
        }
        
        // Small delay between keywords
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`[AI] Successfully generated ${successfulGenerations} articles out of ${keywordsRequested * 2} requested`);
      
      // Only deduct credits if we generated content successfully
      if (articles.length > 0) {
        // Calculate total estimated cost for this request
        const totalEstimatedCost = articles.reduce((sum, article) => {
          const wordCount = article.body.split(/\s+/).length;
          return sum + (wordCount / 1000) * 0.002;
        }, 0);
        
        await database.useCredits(accessKey, keywordsRequested);
        await database.logUsage(accessKey, keywordsRequested, keywordsRequested, keywordsRequested, format, totalEstimatedCost);
        
        console.log(`[DB] Deducted ${keywordsRequested} credits for ${accessKey}`);
        
        res.json({
          success: true,
          articles: articles,
          creditsRemaining: creditsRemaining - keywordsRequested,
          message: `Successfully generated ${articles.length} articles`
        });
      } else {
        throw new Error('Failed to generate any articles');
      }
      
    } catch (generationError) {
      console.error('[AI] Blog generation failed:', generationError);
      throw new Error(`Blog generation failed: ${generationError.message}`);
    }

  } catch (error) {
    console.error('Keyword processing error:', error);
    res.status(500).json({ 
      error: 'Failed to generate blog posts', 
      details: error.message,
      creditsRemaining: keyData ? keyData.credits_total - keyData.credits_used : 0
    });
  }
});

// Admin Dashboard - Secure endpoint
app.post('/api/admin/dashboard', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Ultra-secure admin password
    const ADMIN_PASSWORD = 'KeywordAlchemist2025@SuperAdmin#Dashboard$Analytics!';
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    const analytics = await database.getAdminAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
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
