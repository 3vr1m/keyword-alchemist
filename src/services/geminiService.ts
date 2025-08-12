import { GoogleGenerativeAI } from '@google/generative-ai';
import { BlogPostResponse } from '../types';

const FORMAT_PROMPTS = {
  wordpress: `You are an expert blog post writer and SEO specialist. Your task is to create a high-quality, well-researched, and engaging blog post based on the given keyword. The final output must be suitable for direct copy-pasting into a WordPress editor.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words. This is crucial for SEO and for providing genuine value to the reader. The TL;DR section does not count towards this word count.
2. **Deep Research:** Before writing, conduct thorough research on the keyword to understand the user's intent and the key sub-topics. Do not just rephrase the keyword; provide fresh, insightful, and factual information.
3. **WordPress Formatting (Markdown):** The 'body' of the post must be formatted in clean, standard Markdown.
   * Use H2 headings (\`## Subheading\`) for main sections and H3 headings (\`### Deeper Dive\`) for sub-sections to structure the content logically.
   * Use bullet points (\`* \`) or numbered lists (\`1. \`) for lists to make them easy to read.
   * Use bold text (\`**text**\`) to emphasize key phrases.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the content. The blog owner will handle all linking decisions.
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
}`,

  shopify: `You are an expert e-commerce content writer specializing in Shopify blog posts. Your task is to create a high-quality, commercial-focused blog post that drives sales and engagement for an e-commerce store.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words with a commercial focus.
2. **E-commerce Focus:** Research the keyword with a commercial intent, focusing on how it relates to products, shopping decisions, or customer problems that products can solve.
3. **Shopify HTML Formatting:** Format the 'body' using clean HTML suitable for Shopify blogs.
   * Use \`<h2>\` for main sections and \`<h3>\` for subsections.
   * Use \`<ul>\` and \`<li>\` for bullet points, \`<ol>\` for numbered lists.
   * Use \`<strong>\` for emphasis and \`<p>\` for paragraphs.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the content. The blog owner will handle all linking decisions.
   * Include subtle calls-to-action that encourage browsing products or making purchases.
4. **Commercial Structure:**
   * **Title:** Create a commercial-friendly, SEO-optimized title that hints at shopping or product benefits.
   * **TLDR:** Write a concise summary that emphasizes value and benefits to customers.
   * **Body:** Focus on customer benefits, product applications, shopping guides, or how-to content that leads to purchases.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your commercial-focused title here",
  "tldr": "Your customer-benefit focused summary here",
  "body": "Your 400+ word HTML-formatted blog post body here"
}`,

  ghost: `You are an expert content writer specializing in Ghost CMS publications. Your task is to create a high-quality, reader-focused blog post with clean, professional formatting.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words with excellent readability.
2. **Publishing Focus:** Research the keyword to create authoritative, well-researched content that establishes expertise and builds audience trust.
3. **Ghost Markdown Formatting:** Use clean Markdown optimized for Ghost CMS.
   * Use \`## Heading\` for main sections and \`### Subheading\` for subsections.
   * Use \`- \` for bullet points and \`1. \` for numbered lists.
   * Use \`**bold**\` for emphasis and ensure clean paragraph breaks.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the content. The blog owner will handle all linking decisions.
   * Focus on excellent readability and flow.
4. **Publication Structure:**
   * **Title:** Create a compelling, professional title that attracts serious readers.
   * **TLDR:** Write a sophisticated summary that previews the article's key insights.
   * **Body:** Focus on deep insights, expert analysis, and actionable takeaways that provide genuine value.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your professional, compelling title here",
  "tldr": "Your sophisticated summary here",
  "body": "Your 400+ word markdown-formatted blog post body here"
}`,

  medium: `You are an expert Medium writer specializing in engaging, thought-provoking articles. Your task is to create content that resonates with Medium's educated, professional audience.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words with excellent storytelling.
2. **Medium Style:** Research the keyword to create personal, insightful content with a unique perspective that Medium readers love.
3. **Medium Formatting:** Use Medium-optimized formatting.
   * Use \`## Main Points\` for key sections and \`### Details\` for subsections.
   * Use \`* \` for lists and \`**bold**\` for emphasis.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the content. The blog owner will handle all linking decisions.
   * Write in a conversational, personal tone with storytelling elements.
   * Include thought-provoking questions and personal insights.
4. **Medium Structure:**
   * **Title:** Create an intriguing, clickable title that sparks curiosity.
   * **TLDR:** Write an engaging summary that hooks readers and promises valuable insights.
   * **Body:** Use storytelling, personal anecdotes, and thought-provoking analysis to engage readers.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your intriguing, clickable title here",
  "tldr": "Your engaging, hook-filled summary here",
  "body": "Your 400+ word story-driven blog post body here"
}`,

  html: `You are an expert web content writer. Your task is to create a high-quality blog post using clean, semantic HTML that works across all platforms.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words with excellent structure.
2. **Universal Focus:** Research the keyword to create versatile content suitable for any website or platform.
3. **Clean HTML Formatting:** Use semantic HTML5 elements.
   * Use \`<h2>\` for main headings and \`<h3>\` for subheadings.
   * Use \`<p>\` for paragraphs, \`<ul>/<li>\` for bullet lists, \`<ol>/<li>\` for numbered lists.
   * Use \`<strong>\` for emphasis and \`<em>\` for italics.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or anchor tags in the content. The blog owner will handle all linking decisions.
   * Ensure all HTML is valid and semantic.
4. **Universal Structure:**
   * **Title:** Create a clear, SEO-friendly title suitable for any platform.
   * **TLDR:** Write a concise, informative summary.
   * **Body:** Focus on clear, informative content with excellent structure and readability.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your clear, SEO-friendly title here",
  "tldr": "Your informative summary here",
  "body": "Your 400+ word HTML-formatted blog post body here"
}`,

  markdown: `You are an expert technical writer specializing in clean, portable Markdown content. Your task is to create a high-quality blog post in pure Markdown format.

**Keyword:** {{KEYWORD}}

**Instructions:**

1. **Minimum Body Length:** The 'body' of the blog post must be at least 400 words with excellent technical clarity.
2. **Technical Focus:** Research the keyword to create clear, well-structured content that's informative and actionable.
3. **Pure Markdown Formatting:** Use standard Markdown syntax for maximum compatibility.
   * Use \`## Headings\` for main sections and \`### Subheadings\` for subsections.
   * Use \`- \` for bullet points and \`1. \` for numbered lists.
   * Use \`**bold**\` and \`*italic*\` for emphasis.
   * Use \`\`\`code\`\`\`\` blocks where appropriate.
   * **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the content. The blog owner will handle all linking decisions.
   * Ensure clean, readable formatting that converts well to any platform.
4. **Technical Structure:**
   * **Title:** Create a clear, descriptive title that accurately represents the content.
   * **TLDR:** Write a precise summary highlighting key points and takeaways.
   * **Body:** Focus on clear explanations, actionable advice, and well-organized information.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Your clear, descriptive title here",
  "tldr": "Your precise summary here",
  "body": "Your 400+ word pure markdown blog post body here"
}`
};

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    // Try to use environment variable first, then fallback to provided apiKey
    const envApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const keyToUse = apiKey || envApiKey;
    
    if (keyToUse) {
      this.genAI = new GoogleGenerativeAI(keyToUse);
    }
  }

  setApiKey(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateBlogPost(keyword: string, format: string = 'wordpress', approachHint?: string): Promise<BlogPostResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Get the appropriate prompt for the format
    let promptTemplate = FORMAT_PROMPTS[format as keyof typeof FORMAT_PROMPTS] || FORMAT_PROMPTS.wordpress;
    
    // Add approach hint if provided
    if (approachHint) {
      promptTemplate += `\n\n**Special Focus:** ${approachHint}`;
    }
    
    const prompt = promptTemplate.replace('{{KEYWORD}}', keyword);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("Raw response from Gemini API:", text);
      
      // Try to parse the JSON response with multiple cleaning approaches
      let blogPost;
      try {
        // First, try to extract JSON from markdown code blocks
        let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // If that doesn't work, try to find JSON within the text
        if (!cleanedText.startsWith('{')) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedText = jsonMatch[0];
          }
        }
        
        console.log("Cleaned text for parsing:", cleanedText);
        blogPost = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON parsing failed. Trying alternative parsing...", parseError);
        
        // Alternative approach: try to extract individual fields
        try {
          const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/i);
          const tldrMatch = text.match(/"tldr"\s*:\s*"([^"]*)"/i);
          const bodyMatch = text.match(/"body"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/i);
          
          if (titleMatch && tldrMatch && bodyMatch) {
            blogPost = {
              title: titleMatch[1],
              tldr: tldrMatch[1],
              body: bodyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
            };
            console.log("Successfully parsed using field extraction");
          } else {
            throw new Error("Could not extract required fields from response");
          }
        } catch (extractError) {
          console.error("Field extraction also failed:", extractError);
          throw new Error("Unable to parse Gemini response in any format");
        }
      }
      
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
        console.error("Failed to parse the following text as JSON:", error);
        throw new Error('Failed to parse blog post response. Please try again.');
      }
      throw error;
    }
  }

  async convertFormat(title: string, tldr: string, body: string, fromFormat: string, toFormat: string): Promise<BlogPostResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const conversionPrompt = `You are a content format conversion expert. Convert the following blog post from ${fromFormat} format to ${toFormat} format while preserving all the content and meaning.

**Original Title:** ${title}
**Original TLDR:** ${tldr}
**Original Body (${fromFormat} format):**
${body}

**Instructions:**
1. Convert the content to match the ${toFormat} format specifications
2. Preserve all the original meaning and information
3. Adjust formatting to be optimal for ${toFormat}
4. Keep the same word count and depth of content
5. Maintain SEO optimization
6. **NO LINKS:** Do not include any hyperlinks, URLs, or link markup in the converted content. The blog owner will handle all linking decisions.

Output the result as a single, valid JSON object with the following structure:
{
  "title": "Converted title optimized for ${toFormat}",
  "tldr": "Converted TLDR summary", 
  "body": "Converted body content in ${toFormat} format"
}`;
    
    try {
      const result = await model.generateContent(conversionPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const convertedPost = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!convertedPost.title || !convertedPost.tldr || !convertedPost.body) {
        throw new Error('Invalid response structure from format conversion');
      }
      
      return {
        title: convertedPost.title,
        tldr: convertedPost.tldr,
        body: convertedPost.body
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse format conversion response. Please try again.');
      }
      throw error;
    }
  }

  async generateLinkingSuggestions(title: string, body: string, keyword: string): Promise<{
    keyTerms: string[];
    sections: string[];
    context: string;
  }> {
    if (!this.genAI) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const linkingPrompt = `You are an SEO linking expert. Analyze the following blog post and provide specific linking suggestions that would be most valuable for SEO and user experience.

**Title:** ${title}
**Main Keyword:** ${keyword}
**Content:**
${body}

**Instructions:**
1. Identify 5-8 key terms or phrases from this specific article that would be excellent anchor text for internal links
2. Identify 3-5 section topics or concepts that could benefit from linking to authoritative external sources
3. Provide brief context about why these linking opportunities are valuable
4. Be specific to THIS article - no generic suggestions
5. Focus on terms that readers would naturally want more information about

**Example of what NOT to do:**
- Generic terms like "click here" or "read more"
- Overly broad concepts like "business" or "marketing"

**Example of what TO do:**
- Specific technical terms mentioned in the article
- Tools, methods, or processes discussed
- Related concepts that complement the main topic

Output the result as a single, valid JSON object with the following structure:
{
  "keyTerms": ["specific term 1", "specific term 2", "specific term 3"],
  "sections": ["Section topic 1", "Section topic 2", "Section topic 3"],
  "context": "Brief explanation of why these linking opportunities are valuable for this specific article"
}`;
    
    try {
      const result = await model.generateContent(linkingPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the JSON response
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // If that doesn't work, try to find JSON within the text
      if (!cleanedText.startsWith('{')) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
      }
      
      const suggestions = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!suggestions.keyTerms || !suggestions.sections || !suggestions.context) {
        throw new Error('Invalid response structure from linking suggestions');
      }
      
      return {
        keyTerms: suggestions.keyTerms || [],
        sections: suggestions.sections || [],
        context: suggestions.context || "Consider adding relevant links to enhance user experience and SEO."
      };
    } catch (error) {
      console.error('Failed to generate linking suggestions:', error);
      // Return fallback suggestions
      return {
        keyTerms: [],
        sections: [],
        context: "Consider adding relevant internal and external links to enhance user experience and SEO."
      };
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null;
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
export default geminiService;
