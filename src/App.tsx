import apiService from './services/apiService';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, FileText, DollarSign, Moon, Sun, Copy, CheckCircle, Menu, X } from 'lucide-react';
import './App.css';
import { Keyword, Article, Theme, CurrentView, CreditInfo } from './types';
import { parseKeywordsFromFile, generateUniqueId, copyToClipboard, formatContent, readFileAsText, validateFileType } from './utils/fileUtils';
import { markdownToHtml, getWordCount } from './utils/markdownUtils';
import geminiService from './services/geminiService';

// ArticleTabView Component for displaying multiple approaches in tabs
interface ArticleTabViewProps {
  keyword: string;
  articles: Article[];
  outputFormat: string;
  getFormatDisplayName: (format: string) => string;
  handleCopyToClipboard: (article: Article) => void;
  copiedArticleId: string | null;
  convertingArticleId: string | null;
  markdownToHtml: (markdown: string) => string;
  getWordCount: (text: string) => number;
}

function ArticleTabView({
  keyword,
  articles,
  outputFormat,
  getFormatDisplayName,
  handleCopyToClipboard,
  copiedArticleId,
  convertingArticleId,
  markdownToHtml,
  getWordCount
}: ArticleTabViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  
  if (articles.length === 0) return null;
  
  const activeArticle = articles[activeTab] || articles[0];
  
  return (
    <div className="article-card">
      {/* Refined Tab Header */}
      <div className="article-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
        {/* Top row: Context + Copy button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ flex: 1, marginRight: '20px' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '400' }}>Article created based on:</span>
            <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.3' }}>
              "{keyword}"
            </div>
          </div>
          
          <button 
            className="copy-button"
            onClick={() => handleCopyToClipboard(activeArticle)}
            style={{
              padding: '12px 18px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '140px',
              justifyContent: 'center'
            }}
          >
            {convertingArticleId === `${activeArticle.keyword}-${activeArticle.approach || 'default'}` ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                Converting...
              </>
            ) : copiedArticleId === `${activeArticle.keyword}-${activeArticle.approach || 'default'}` ? (
              <>
                <CheckCircle size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy to {getFormatDisplayName(outputFormat)}
                {activeArticle.originalFormat && activeArticle.originalFormat !== outputFormat && (
                  <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>(converts)</span>
                )}
              </>
            )}
          </button>
        </div>
        
        {/* Bottom row: Version selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500', minWidth: 'fit-content' }}>Choose Version:</span>
          <div className="article-tabs" style={{
            display: 'flex',
            gap: '3px',
            background: 'var(--bg-secondary)',
            padding: '3px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            {articles.map((article, index) => (
              <button
                key={index}
                className={`tab-button ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  background: activeTab === index ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === index ? 'white' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: activeTab === index ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {article.approach || `Version ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        <h2 className="article-title">{activeArticle.title}</h2>
        
        <div className="article-tldr">
          <p>{activeArticle.tldr}</p>
        </div>
        
        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(activeArticle.body) }}
        />
        
        {/* SEO Linking Suggestions Section */}
        {activeArticle.linkingSuggestions && (
          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--accent-primary)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--accent-primary)', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              SEO Linking Suggestions
            </h3>
            
            <p style={{ 
              fontSize: '15px', 
              color: 'var(--text-secondary)', 
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              {activeArticle.linkingSuggestions.context}
            </p>
            
            {activeArticle.linkingSuggestions.keyTerms.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px' 
                }}>
                  🎯 Key Terms for Internal Linking:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeArticle.linkingSuggestions.keyTerms.map((term, index) => (
                    <span 
                      key={index}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}
                    >
                      "{term}"
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeArticle.linkingSuggestions.sections.length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px' 
                }}>
                  🌐 Topics for External Linking:
                </h4>
                <ul style={{ 
                  margin: '0', 
                  paddingLeft: '18px',
                  color: 'var(--text-primary)'
                }}>
                  {activeArticle.linkingSuggestions.sections.map((section, index) => (
                    <li 
                      key={index}
                      style={{
                        fontSize: '15px',
                        marginBottom: '4px',
                        lineHeight: '1.5'
                      }}
                    >
                      {section}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ 
              marginTop: '12px', 
              fontSize: '13px', 
              color: 'var(--text-muted)', 
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              💡 These suggestions are AI-generated and specific to your article content
            </div>
          </div>
        )}
        
        <div style={{ 
          fontSize: '15px', 
          color: 'var(--text-secondary)', 
          marginTop: '20px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            Word count: {getWordCount(activeArticle.body)} words • Generated: {activeArticle.createdAt.toLocaleDateString()}
          </span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            Tab {activeTab + 1} of {articles.length}
          </span>
        </div>
      </div>
    </div>
  );
}

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

  // Credit system state
  const [accessKey, setAccessKey] = useState("");
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [outputFormat, setOutputFormat] = useState<string>('wordpress');
  const [convertingArticleId, setConvertingArticleId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme and API key from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Check environment variable first, then localStorage
    const envApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const savedApiKey = localStorage.getItem('geminiApiKey');
    
    if (envApiKey) {
      setApiKey(envApiKey);
      geminiService.setApiKey(envApiKey);
    } else if (savedApiKey) {
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

  // Validate access key and get credit info
  const validateAccessKey = async (key: string) => {
    if (!key.trim()) {
      setKeyError("Please enter an access key");
      setCreditInfo(null);
      return false;
    }

    setIsValidatingKey(true);
    setKeyError("");

    try {
      console.log('Validating access key:', key.trim());
      const response = await apiService.validateAccessKey(key.trim());
      console.log('Validation response:', response);
      setCreditInfo(response);
      setKeyError("");
      return true;
    } catch (error: any) {
      console.error('Access key validation failed:', error);
      
      let errorMessage = "Invalid access key";
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      } else if (error.response?.status === 404) {
        errorMessage = "API endpoint not found. Please contact support.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setKeyError(errorMessage);
      setCreditInfo(null);
      return false;
    } finally {
      setIsValidatingKey(false);
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
    // Check if we have a valid access key and credits
    if (!creditInfo || creditInfo.creditsRemaining <= 0) {
      alert('Please validate your access key first or purchase more credits!');
      return;
    }

    const pendingKeywords = keywords.filter(k => k.status === 'pending');
    if (pendingKeywords.length === 0) {
      alert('No keywords to process!');
      return;
    }

    // Check if we have enough credits for all pending keywords
    if (pendingKeywords.length > creditInfo.creditsRemaining) {
      alert(`You have ${creditInfo.creditsRemaining} credits remaining, but you're trying to process ${pendingKeywords.length} keywords. Please reduce your keyword list or purchase more credits.`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use the backend API to process all keywords at once
      const response = await apiService.processKeywords(accessKey, pendingKeywords.map(k => k.text));
      
      // Process the response and update the UI
      const { articles: generatedArticles, creditsRemaining } = response;
      
      // Update credit info
      setCreditInfo(prev => prev ? {
        ...prev,
        creditsRemaining: creditsRemaining
      } : null);
      
      // Process each generated article
      const processedArticles: Article[] = [];
      
      for (const articleData of generatedArticles) {
        const article: Article = {
          title: articleData.title,
          tldr: articleData.tldr,
          body: articleData.body,
          keyword: articleData.keyword,
          approach: articleData.approach,
          originalFormat: outputFormat,
          createdAt: new Date(),
          linkingSuggestions: articleData.linkingSuggestions
        };
        
        processedArticles.push(article);
      }
      
      // Update keyword statuses to completed
      setKeywords(prev => prev.map(k => {
        if (pendingKeywords.find(pk => pk.id === k.id)) {
          const keywordArticles = processedArticles.filter(a => a.keyword === k.text);
          return { ...k, status: 'completed', articles: keywordArticles };
        }
        return k;
      }));
      
      // Add all processed articles
      setArticles(prev => [...prev, ...processedArticles]);
      
    } catch (error: any) {
      console.error('Error generating blog posts:', error);
      
      // Update all pending keywords to error status
      setKeywords(prev => prev.map(k => {
        if (pendingKeywords.find(pk => pk.id === k.id)) {
          return { 
            ...k, 
            status: 'error', 
            error: error.response?.data?.error || error.message || 'Unknown error'
          };
        }
        return k;
      }));
      
      alert(`Failed to generate blog posts: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }

    setIsGenerating(false);
  };

  const handleCopyToClipboard = async (article: Article) => {
    let content: string;
    const articleId = `${article.keyword}-${article.approach || 'default'}`;
    
    try {
      // Check if we need to convert format
      if (article.originalFormat && article.originalFormat !== outputFormat) {
        console.log(`Converting from ${article.originalFormat} to ${outputFormat}...`);
        
        // Show loading state for conversion
        setConvertingArticleId(articleId);
        
        // Dynamic format conversion - regenerate content in new format
        try {
          const convertedPost = await geminiService.convertFormat(
            article.title,
            article.tldr, 
            article.body,
            article.originalFormat,
            outputFormat
          );
          
          if (!convertedPost.title || !convertedPost.body) {
            throw new Error('Invalid conversion response');
          }
          
          content = formatContent(convertedPost.title, convertedPost.body, outputFormat);
          console.log('Format conversion successful');
        } catch (conversionError) {
          console.warn('Format conversion failed, using original content:', conversionError);
          content = formatContent(article.title, article.body, outputFormat);
        } finally {
          // Clear loading state
          setConvertingArticleId(null);
        }
      } else {
        // Use original content
        content = formatContent(article.title, article.body, outputFormat);
      }
      
      // Ensure content is valid
      if (!content || content.trim().length === 0) {
        throw new Error('Content is empty or invalid');
      }
      
      console.log('Attempting to copy content to clipboard...', { contentLength: content.length });
      const success = await copyToClipboard(content);
      
      if (success) {
        setCopiedArticleId(articleId);
        setTimeout(() => setCopiedArticleId(null), 2000);
        console.log('Successfully copied to clipboard');
      } else {
        throw new Error('Clipboard copy returned false');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      setConvertingArticleId(null); // Clear loading state on error
      alert(`Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getFormatDisplayName = (format: string): string => {
    const formatNames: { [key: string]: string } = {
      'wordpress': 'WordPress',
      'shopify': 'Shopify',
      'ghost': 'Ghost',
      'medium': 'Medium',
      'html': 'HTML',
      'markdown': 'Markdown'
    };
    return formatNames[format] || 'WordPress';
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
      {!isMobileMenuOpen && (
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={20} />
        </button>
      )}
      
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
          <h3 className="section-title">🔑 Access Key</h3>
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Enter access key (e.g., KWA-XXXXXX)"
            className="format-select"
          />
          <button 
            onClick={() => validateAccessKey(accessKey)}
            disabled={isValidatingKey || !accessKey.trim()}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
              background: isValidatingKey || !accessKey.trim() ? 'var(--bg-secondary)' : 'var(--accent-primary)',
              color: isValidatingKey || !accessKey.trim() ? 'var(--text-muted)' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isValidatingKey || !accessKey.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isValidatingKey ? 'Validating...' : 'Validate Key'}
          </button>
          {keyError && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0' }}>{keyError}</p>}
          {creditInfo && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '5px' }}>{creditInfo.creditsRemaining}/{creditInfo.creditsTotal} credits</div>}
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
        
        <div className="format-section">
          <h3 className="section-title">Output Format</h3>
          <select 
            className="format-select"
            value={outputFormat} 
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <option value="wordpress">WordPress</option>
            <option value="shopify">Shopify Blog</option>
            <option value="ghost">Ghost CMS</option>
            <option value="medium">Medium</option>
            <option value="html">Generic HTML</option>
            <option value="markdown">Pure Markdown</option>
          </select>
          <p className="format-description">
            {outputFormat === 'wordpress' && 'Optimized HTML for WordPress posts with proper heading structure.'}
            {outputFormat === 'shopify' && 'HTML formatted for Shopify blog posts with commercial focus.'}
            {outputFormat === 'ghost' && 'Clean Markdown format perfect for Ghost CMS publishing.'}
            {outputFormat === 'medium' && 'Rich text format optimized for Medium publications.'}
            {outputFormat === 'html' && 'Standard HTML markup that works with most platforms.'}
            {outputFormat === 'markdown' && 'Pure Markdown format for maximum compatibility.'}
          </p>
        </div>
        
        <button
          className="generate-button"
          onClick={generateBlogPosts}
          disabled={
            isGenerating || 
            keywords.filter(k => k.status === 'pending').length === 0 || 
            !creditInfo || 
            creditInfo.creditsRemaining <= 0
          }
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
                  Your generated posts will appear here, ready to copy and paste into {getFormatDisplayName(outputFormat)}.
                </p>
              </div>
            ) : (
              <>
                <div className="articles-header">
                  <h2 className="articles-title">Your Generated Articles</h2>
                  <p className="articles-subtitle">
                    Here are your AI-generated blog posts, ready to copy and paste into {getFormatDisplayName(outputFormat)}. 
                    Each article is crafted with SEO best practices and engaging content tailored to your keywords.
                  </p>
                  <div style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginTop: '16px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>💡</span>
                      <strong>ProTip:</strong> Check out the SEO linking suggestions at the bottom of each article to optimize your internal and external linking strategy!
                    </p>
                  </div>
                </div>
                {(() => {
                  // Group articles by keyword
                  const groupedArticles = articles.reduce((acc, article) => {
                    const keyword = article.keyword;
                    if (!acc[keyword]) {
                      acc[keyword] = [];
                    }
                    acc[keyword].push(article);
                    return acc;
                  }, {} as Record<string, Article[]>);

                  return Object.entries(groupedArticles).map(([keyword, keywordArticles]) => {
                    // Sort articles by approach for consistent tab order
                    const sortedArticles = keywordArticles.sort((a, b) => {
                      if (!a.approach || !b.approach) return 0;
                      return a.approach.localeCompare(b.approach);
                    });

                    return (
                      <ArticleTabView 
                        key={keyword}
                        keyword={keyword}
                        articles={sortedArticles}
                        outputFormat={outputFormat}
                        getFormatDisplayName={getFormatDisplayName}
                        handleCopyToClipboard={handleCopyToClipboard}
                        copiedArticleId={copiedArticleId}
                        convertingArticleId={convertingArticleId}
                        markdownToHtml={markdownToHtml}
                        getWordCount={getWordCount}
                      />
                    );
                  });
                })()}
              </>
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
                  <div style={{ background: 'var(--success-color)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>
                    Save $9.90 (16%)
                  </div>
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
                  <div style={{ background: 'var(--success-color)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>
                    Save $43.76 (30%)
                  </div>
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
 
