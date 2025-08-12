export interface Keyword {
  id: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
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

export type CurrentView = 'articles' | 'pricing';
