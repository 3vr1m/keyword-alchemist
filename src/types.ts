export interface Keyword {
  id: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  article?: Article;  // Keeping for backwards compatibility
  articles?: Article[];  // New field for multiple articles
  error?: string;
}

export interface Article {
  title: string;
  tldr: string;
  body: string;
  keyword: string;
  approach?: string;
  originalFormat: string;
  createdAt: Date;
  linkingSuggestions?: {
    keyTerms: string[];
    sections: string[];
    context: string;
  };
}

export interface BlogPostResponse {
  title: string;
  tldr: string;
  body: string;
}

export type Theme = 'light' | 'dark';

export type CurrentView = 'articles' | 'pricing' | 'admin';

// Credit system types
export interface CreditInfo {
  valid: boolean;
  plan: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  status: string;
}

export interface ProcessResponse {
  success: boolean;
  message: string;
  creditsRemaining: number;
  keywordsToProcess?: string[];
  allowedKeywords?: string[];
  rejectedKeywords?: string[];
}
