import apiService from './services/apiService';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, FileText, DollarSign, Moon, Sun, Copy, CheckCircle, Menu, X } from 'lucide-react';
import './App.css';
import { Keyword, Article, Theme, CurrentView, CreditInfo } from './types';
import { parseKeywordsFromFile, generateUniqueId, copyToClipboard, formatContent, readFileAsText, validateFileType } from './utils/fileUtils';
import { markdownToHtml, getWordCount } from './utils/markdownUtils';
import AdminDashboard from './components/AdminDashboard';

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
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [purchaseEmail, setPurchaseEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme and API key from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Check for payment success/cancellation from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled. You can try again anytime!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
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
    let keywordsToProcess = pendingKeywords;
    let warningMessage = '';
    
    if (pendingKeywords.length > creditInfo.creditsRemaining) {
      keywordsToProcess = pendingKeywords.slice(0, creditInfo.creditsRemaining);
      const skippedCount = pendingKeywords.length - creditInfo.creditsRemaining;
      
      warningMessage = `⚠️ Processing ${keywordsToProcess.length} keywords (your available credits). ${skippedCount} keyword${skippedCount > 1 ? 's' : ''} will be skipped due to insufficient credits.`;
      
      if (!window.confirm(`${warningMessage}\n\nDo you want to proceed with processing ${keywordsToProcess.length} keywords?`)) {
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      // Use the backend API to process available keywords
      const response = await apiService.processKeywords(accessKey, keywordsToProcess.map(k => k.text));
      
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
      
      // Update keyword statuses - completed for processed, skipped for others
      setKeywords(prev => prev.map(k => {
        if (keywordsToProcess.find(pk => pk.id === k.id)) {
          const keywordArticles = processedArticles.filter(a => a.keyword === k.text);
          return { ...k, status: 'completed', articles: keywordArticles };
        } else if (pendingKeywords.find(pk => pk.id === k.id)) {
          // This was pending but not processed due to credit limits
          return { ...k, status: 'skipped', error: 'Insufficient credits' };
        }
        return k;
      }));
      
      // Add all processed articles
      setArticles(prev => [...prev, ...processedArticles]);
      
    } catch (error: any) {
      console.error('Error generating blog posts:', error);
      
      // Update keywords to error status - only those we tried to process
      setKeywords(prev => prev.map(k => {
        if (keywordsToProcess && keywordsToProcess.find(pk => pk.id === k.id)) {
          return { 
            ...k, 
            status: 'error', 
            error: error.response?.data?.error || error.message || 'Unknown error'
          };
        } else if (pendingKeywords.find(pk => pk.id === k.id)) {
          // This was pending but not processed due to credit limits
          return { ...k, status: 'skipped', error: 'Insufficient credits' };
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
        
        // Use original content - format conversion moved to backend
        content = formatContent(article.title, article.body, outputFormat);
        setConvertingArticleId(null);
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

  const removeKeyword = (keywordId: string) => {
    setKeywords(prev => prev.filter(k => k.id !== keywordId));
    // Also remove associated articles
    setArticles(prev => {
      const keywordToRemove = keywords.find(k => k.id === keywordId);
      if (keywordToRemove) {
        return prev.filter(a => a.keyword !== keywordToRemove.text);
      }
      return prev;
    });
  };

  // Handle plan selection - show email modal
  const handlePlanClick = (plan: string) => {
    setSelectedPlan(plan);
    setShowEmailModal(true);
  };

  // Handle email modal submission
  const handleEmailSubmit = async () => {
    if (!purchaseEmail.trim()) {
      alert('Please enter your email address!');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaseEmail)) {
      alert('Please enter a valid email address!');
      return;
    }

    if (!selectedPlan) {
      alert('No plan selected!');
      return;
    }

    setProcessingPayment(selectedPlan);
    setShowEmailModal(false);

    try {
      const response = await apiService.createStripeCheckout(selectedPlan, purchaseEmail);
      
      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      alert(`Payment setup failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  // Close email modal
  const closeEmailModal = () => {
    setShowEmailModal(false);
    setSelectedPlan(null);
    setProcessingPayment(null);
  };

  // Handle payment success from Stripe redirect
  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      const response = await apiService.verifyPayment(sessionId);
      
      if (response.success && response.paid && response.accessKey) {
        // Set the access key automatically
        setAccessKey(response.accessKey);
        
        // Auto-validate the key to get credit info
        await validateAccessKey(response.accessKey);
        
        // Switch to articles view
        setCurrentView('articles');
        
        // Show success message with access key
        alert(`🎉 Payment successful!\n\nYour access key: ${response.accessKey}\n\nThis key has been automatically added and you're ready to generate blog posts!`);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        alert('Payment verification failed. Please contact support if you believe this is an error.');
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      alert('Failed to verify payment. Please contact support with your session ID: ' + sessionId);
    }
  };

  // Status circle component
  const StatusCircle = ({ status }: { status: string }) => {
    const getStatusStyle = () => {
      switch (status) {
        case 'pending':
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid var(--text-muted)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          };
        case 'processing':
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#f59e0b', // yellow-ish
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          };
        case 'completed':
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#10b981', // green
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          };
        case 'error':
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ef4444', // red
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          };
        case 'skipped':
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#f97316', // orange
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          };
        default:
          return {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid var(--text-muted)',
            background: 'transparent'
          };
      }
    };

    const getIcon = () => {
      switch (status) {
        case 'processing':
          return <div className="loading-spinner" style={{ width: '10px', height: '10px' }} />;
        case 'completed':
          return <span style={{ fontSize: '10px', fontWeight: 'bold' }}>✓</span>;
        case 'error':
          return <span style={{ fontSize: '8px', fontWeight: 'bold' }}>✕</span>;
        case 'skipped':
          return <span style={{ fontSize: '8px', fontWeight: 'bold' }}>⚠</span>;
        default:
          return null;
      }
    };

    return (
      <div style={getStatusStyle()} title={status.charAt(0).toUpperCase() + status.slice(1)}>
        {getIcon()}
      </div>
    );
  };


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
        
        {/* Admin Dashboard Link - Subtle at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }}>
          <div 
            onClick={() => {
              setCurrentView('admin');
              setIsMobileMenuOpen(false);
            }}
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              cursor: 'pointer',
              opacity: 0.5,
              transition: 'opacity 0.2s',
              padding: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            System Analytics
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
              <div key={keyword.id} className={`keyword-item ${keyword.status}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                marginBottom: '8px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <StatusCircle status={keyword.status} />
                  <span className="keyword-text" style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-primary)',
                    flex: 1
                  }}>
                    {keyword.text}
                  </span>
                </div>
                <button
                  onClick={() => removeKeyword(keyword.id)}
                  disabled={keyword.status === 'processing'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error-color)',
                    cursor: keyword.status === 'processing' ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: keyword.status === 'processing' ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (keyword.status !== 'processing') {
                      e.currentTarget.style.background = 'var(--error-color)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (keyword.status !== 'processing') {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = 'var(--error-color)';
                    }
                  }}
                  title="Remove keyword"
                >
                  <X size={16} />
                </button>
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
          ) : currentView === 'admin' ? (
            <AdminDashboard onClose={() => setCurrentView('articles')} />
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
                  <button 
                    className="plan-button"
                    onClick={() => handlePlanClick('basic')}
                    disabled={processingPayment === 'basic'}
                  >
                    {processingPayment === 'basic' ? 'Processing...' : 'Get Started'}
                  </button>
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
                  <button 
                    className="plan-button"
                    onClick={() => handlePlanClick('blogger')}
                    disabled={processingPayment === 'blogger'}
                  >
                    {processingPayment === 'blogger' ? 'Processing...' : 'Choose Plan'}
                  </button>
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
                  <button 
                    className="plan-button"
                    onClick={() => handlePlanClick('pro')}
                    disabled={processingPayment === 'pro'}
                  >
                    {processingPayment === 'pro' ? 'Processing...' : 'Choose Plan'}
                  </button>
                  <p className="plan-note">One-time purchase, credits never expire.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                Complete Your Purchase
              </h3>
              <button
                onClick={closeEmailModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {selectedPlan && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  color: 'var(--accent-primary)',
                  textTransform: 'capitalize'
                }}>
                  {selectedPlan} Plan
                </h4>
                <p style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  {selectedPlan === 'basic' && '$5.99 • 10 credits • Up to 20 blog posts'}
                  {selectedPlan === 'blogger' && '$50 • 50 credits • Up to 100 blog posts'}
                  {selectedPlan === 'pro' && '$100 • 240 credits • Up to 480 blog posts'}
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                📧 Email Address
              </label>
              <input
                type="email"
                value={purchaseEmail}
                onChange={(e) => setPurchaseEmail(e.target.value)}
                placeholder="Enter your email address"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEmailSubmit();
                  }
                }}
              />
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                Your access key will be automatically generated and you'll be redirected back after payment
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeEmailModal}
                style={{
                  padding: '12px 24px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={!purchaseEmail.trim() || !!processingPayment}
                style={{
                  padding: '12px 32px',
                  border: 'none',
                  borderRadius: '8px',
                  background: !purchaseEmail.trim() || !!processingPayment ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                  color: !purchaseEmail.trim() || !!processingPayment ? 'var(--text-muted)' : 'white',
                  cursor: !purchaseEmail.trim() || !!processingPayment ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {processingPayment ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
 
