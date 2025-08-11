import { GoogleGenerativeAI } from '@google/generative-ai';
import { BlogPostResponse } from '../types';

const GEMINI_PROMPT = `You are an expert blog post writer and SEO specialist. Your task is to create a high-quality, well-researched, and engaging blog post based on the given keyword. The final output must be suitable for direct copy-pasting into a WordPress editor.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words. This is crucial for SEO and for providing genuine value to the reader. The TL;DR section does not count towards this word count.
2. **Deep Research:** Before writing, conduct thorough research on the keyword to understand the user's intent and the key sub-topics. Do not just rephrase the keyword; provide fresh, insightful, and factual information.
3. **WordPress Formatting (Markdown):** The 'body' of the post must be formatted in clean, standard Markdown.
    * Use H2 headings (\`## Subheading\`) for main sections and H3 headings (\`### Deeper Dive\`) for sub-sections to structure the content logically.
    * Use bullet points (\`* \`) or numbered lists (\`1. \`) for lists to make them easy to read.
    * Use bold text (\`**text**\`) to emphasize key phrases.
    * Ensure paragraphs are well-separated by a blank line for clean formatting.
4. **Structure:**
    * **Title:** Create a catchy, descriptive, and SEO-friendly title.
    * **TLDR:** Write a concise 2-3 sentence summary for the 'tldr' field. **DO NOT** include this in the 'body' field.
    * **Body:**
        * Start the 'body' with a compelling introduction that grabs the reader's attention. Do not add a "TLDR" or "Summary" section at the start of the body.
        * Develop the main points in the body, using the formatting rules above.
        * End with a strong conclusion or key takeaways that summarize the main points.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your SEO-friendly title here",
  "tldr": "Your 2-3 sentence summary here",
  "body": "Your 400+ word markdown-formatted blog post body here"
}`;

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateBlogPost(keyword: string): Promise<BlogPostResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = GEMINI_PROMPT.replace('{{KEYWORD}}', keyword);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const blogPost = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!blogPost.title || !blogPost.tldr || !blogPost.body) {
        throw new Error('Invalid response structure from Gemini API');
      }
      
      // Ensure minimum word count
      const wordCount = blogPost.body.split(/\s+/).length;
      if (wordCount < 400) {
        throw new Error(`Blog post body is too short (${wordCount} words). Minimum 400 words required.`);
      }
      
      return {
        title: blogPost.title,
        tldr: blogPost.tldr,
        body: blogPost.body
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse blog post response. Please try again.');
      }
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null;
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
export default geminiService;
