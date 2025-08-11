import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, FileText, DollarSign, Moon, Sun, Copy, CheckCircle, Menu, X } from 'lucide-react';
import './App.css';
import { Keyword, Article, Theme, CurrentView } from './types';
import { parseKeywordsFromFile, generateUniqueId, copyToClipboard, formatWordPressContent, readFileAsText, validateFileType } from './utils/fileUtils';
import { markdownToHtml, getWordCount } from './utils/markdownUtils';
import geminiService from './services/geminiService';

function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [currentView, setCurrentView] = useState<CurrentView>('articles');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme and API key from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      geminiService.setApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('geminiApiKey', apiKey.trim());
      geminiService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFileType(file)) {
      alert('Please upload a .txt or .csv file');
      return;
    }

    try {
      const content = await readFileAsText(file);
      const newKeywords = parseKeywordsFromFile(content);
      
      const keywordObjects: Keyword[] = newKeywords.map(text => ({
        id: generateUniqueId(),
        text,
        status: 'pending'
      }));
      
      setKeywords(prev => [...prev, ...keywordObjects]);
    } catch (error) {
      alert('Error reading file. Please try again.');
      console.error('File upload error:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const generateBlogPosts = async () => {
    if (!geminiService.isConfigured()) {
      setShowApiKeyInput(true);
      return;
    }

    const pendingKeywords = keywords.filter(k => k.status === 'pending');
    if (pendingKeywords.length === 0) {
      alert('No keywords to process!');
      return;
    }

    setIsGenerating(true);
    
    for (const keyword of pendingKeywords) {
      // Update status to processing
      setKeywords(prev => prev.map(k => 
        k.id === keyword.id ? { ...k, status: 'processing' } : k
      ));

      try {
        const blogPost = await geminiService.generateBlogPost(keyword.text);
        
        const article: Article = {
          title: blogPost.title,
          tldr: blogPost.tldr,
          body: blogPost.body,
          keyword: keyword.text,
          createdAt: new Date()
        };

        // Update keyword status and add article
        setKeywords(prev => prev.map(k => 
          k.id === keyword.id ? { ...k, status: 'completed', article } : k
        ));
        
        setArticles(prev => [...prev, article]);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error generating blog post:', error);
        setKeywords(prev => prev.map(k => 
          k.id === keyword.id ? { 
            ...k, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : k
        ));
      }
    }

    setIsGenerating(false);
  };

  const handleCopyToClipboard = async (article: Article) => {
    const content = formatWordPressContent(article.title, article.body);
    const success = await copyToClipboard(content);
    
    if (success) {
      setCopiedArticleId(article.keyword);
      setTimeout(() => setCopiedArticleId(null), 2000);
    } else {
      alert('Failed to copy to clipboard');
    }
  };

  const clearAllKeywords = () => {
    setKeywords([]);
    setArticles([]);
  };

  if (showApiKeyInput) {
    return (
      <div className="app">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-primary)' }}>Configure Gemini API</h2>
            <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-secondary)' }}>Please enter your Google Gemini API key to get started.</p>
            <form onSubmit={handleApiKeySubmit}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '16px'
                }}
                required
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save API Key
              </button>
            </form>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
              Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>Google AI Studio</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
        <Menu size={20} />
      </button>
      
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
      
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />
      
      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="app-title">Keyword Alchemist</h1>
          <p className="app-subtitle">Transform keywords into blog posts</p>
          <button 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none'
            }}
            className="mobile-close"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className="sidebar-nav">
          <div 
            className={`sidebar-nav-item ${currentView === 'articles' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('articles');
              setIsMobileMenuOpen(false);
            }}
          >
            <FileText size={18} />
            Articles
          </div>
          <div 
            className={`sidebar-nav-item ${currentView === 'pricing' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('pricing');
              setIsMobileMenuOpen(false);
            }}
          >
            <DollarSign size={18} />
            Pricing
          </div>
        </div>
        
        <div className="upload-section">
          <div 
            className={`upload-area ${dragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="upload-icon" size={28} />
            <div className="upload-text">Upload Keywords</div>
            <div className="upload-subtext">Drag & drop .csv/.txt file</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>
        
        <button 
          className="generate-button"
          onClick={generateBlogPosts}
          disabled={isGenerating || keywords.filter(k => k.status === 'pending').length === 0}
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Posts
            </>
          )}
        </button>
        
        <div className="keywords-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title">Keywords ({keywords.length})</h3>
            {keywords.length > 0 && (
              <button 
                onClick={clearAllKeywords}
                style={{
                  background: 'none',
                  border: '1px solid var(--error-color)',
                  color: 'var(--error-color)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="keyword-list">
            {keywords.map(keyword => (
              <div key={keyword.id} className={`keyword-item ${keyword.status}`}>
                <span className="keyword-text">{keyword.text}</span>
                <span className={`keyword-status ${keyword.status}`}>
                  {keyword.status === 'processing' && <div className="loading-spinner" />}
                  {keyword.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="main-header">
          <div>
            <h2 className="main-title">Generated Articles</h2>
            <p className="main-subtitle">High-quality blog posts ready for WordPress</p>
          </div>
          <div className="nav-buttons">
            <button 
              className={`nav-button ${currentView === 'articles' ? 'active' : ''}`}
              onClick={() => setCurrentView('articles')}
            >
              <FileText size={16} />
              Articles
            </button>
            <button 
              className={`nav-button ${currentView === 'pricing' ? 'active' : ''}`}
              onClick={() => setCurrentView('pricing')}
            >
              <DollarSign size={16} />
              Pricing
            </button>
          </div>
        </div>
        
        <div className="articles-container">
          {currentView === 'articles' ? (
            articles.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-state-icon" size={64} />
                <h3 className="empty-state-title">Welcome to Keyword Alchemist</h3>
                <p className="empty-state-text">
                  Upload a keyword file, click "Generate Posts", and watch the magic happen. 
                  Your generated posts will appear here, ready to copy and paste into WordPress.
                </p>
              </div>
            ) : (
              articles.map((article, index) => (
                <div key={`${article.keyword}-${index}`} className="article-card">
                  <div className="article-header">
                    <span className="article-keyword">{article.keyword}</span>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopyToClipboard(article)}
                    >
                      {copiedArticleId === article.keyword ? (
                        <>
                          <CheckCircle size={16} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy to WordPress
                        </>
                      )}
                    </button>
                  </div>
                  
                  <h2 className="article-title">{article.title}</h2>
                  
                  <div className="article-tldr">
                    <h4>TL;DR</h4>
                    <p>{article.tldr}</p>
                  </div>
                  
                  <div 
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(article.body) }}
                  />
                  
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    Word count: {getWordCount(article.body)} words • Generated: {article.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))
            )
          ) : (
            // Pricing Page
            <div className="pricing-container">
              <div className="pricing-header">
                <h2 className="pricing-title">Find the perfect plan</h2>
                <p className="pricing-subtitle">
                  Keyword Alchemist works by transforming each keyword you provide into a complete, 
                  well-researched blog post. Your plan determines how many of these powerful 
                  transformations you can perform.
                </p>
              </div>
              
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h3 className="plan-name">Basic</h3>
                  <p className="plan-description">Perfect for getting started and testing the waters.</p>
                  <div className="plan-price">$5.99</div>
                  <ul className="plan-features">
                    <li>10 Keyword Credits</li>
                    <li>Up to 20 blog posts</li>
                    <li>AI-powered generation</li>
                  </ul>
                  <button className="plan-button">Get Started</button>
                  <p className="plan-note">One-time purchase, credits never expire.</p>
                </div>
                
                <div className="pricing-card popular">
                  <h3 className="plan-name">Blogger</h3>
                  <p className="plan-description">Ideal for serious bloggers building an authority site.</p>
                  <div className="plan-price">$50</div>
                  <ul className="plan-features">
                    <li>100 Keyword Credits</li>
                    <li>Up to 200 blog posts</li>
                    <li>AI-powered generation</li>
                    <li>Priority support</li>
                  </ul>
                  <button className="plan-button">Choose Plan</button>
                  <p className="plan-note">One-time purchase, credits never expire.</p>
                </div>
                
                <div className="pricing-card">
                  <h3 className="plan-name">Pro / Agency</h3>
                  <p className="plan-description">For professionals managing multiple sites or high-volume content.</p>
                  <div className="plan-price">$100</div>
                  <ul className="plan-features">
                    <li>240 Keyword Credits</li>
                    <li>Up to 480 blog posts</li>
                    <li>AI-powered generation</li>
                    <li>Priority support</li>
                  </ul>
                  <button className="plan-button">Choose Plan</button>
                  <p className="plan-note">One-time purchase, credits never expire.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
