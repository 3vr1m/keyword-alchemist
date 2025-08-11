export interface Keyword {
  id: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  article?: Article;
  error?: string;
}

export interface Article {
  title: string;
  tldr: string;
  body: string;
  keyword: string;
  createdAt: Date;
}

export interface BlogPostResponse {
  title: string;
  tldr: string;
  body: string;
}

export type Theme = 'light' | 'dark';

export type CurrentView = 'articles' | 'pricing';
