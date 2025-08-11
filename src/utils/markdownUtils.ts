export const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Convert unordered lists
  const unorderedListRegex = /^[\s]*\*[\s]+(.*$)/gm;
  html = html.replace(unorderedListRegex, '<li>$1</li>');
  
  // Convert numbered lists
  const orderedListRegex = /^[\s]*\d+\.[\s]+(.*$)/gm;
  html = html.replace(orderedListRegex, '<li>$1</li>');
  
  // Wrap consecutive <li> tags in <ul> or <ol>
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    // Check if this is part of a numbered list (contains original numbered format)
    const originalText = markdown.match(/^\s*\d+\.\s/gm);
    if (originalText && originalText.length > 0) {
      return `<ol>${match}</ol>`;
    }
    return `<ul>${match}</ul>`;
  });
  
  // Convert line breaks to paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Don't wrap headers, lists in p tags
      if (paragraph.startsWith('<h') || 
          paragraph.startsWith('<ul>') || 
          paragraph.startsWith('<ol>') ||
          paragraph.startsWith('<li>')) {
        return paragraph;
      }
      
      return `<p>${paragraph}</p>`;
    })
    .filter(p => p)
    .join('\n\n');
  
  // Clean up any remaining line breaks within tags
  html = html.replace(/\n(?=<)/g, '');
  html = html.replace(/(>)\n/g, '$1');
  
  return html;
};

export const stripMarkdown = (markdown: string): string => {
  let text = markdown;
  
  // Remove headers
  text = text.replace(/^#{1,6}\s+(.*$)/gm, '$1');
  
  // Remove bold and italic
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  
  // Remove list markers
  text = text.replace(/^[\s]*\*[\s]+/gm, '');
  text = text.replace(/^[\s]*\d+\.[\s]+/gm, '');
  
  // Clean up extra whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  
  return text.trim();
};

export const getWordCount = (text: string): number => {
  return stripMarkdown(text).split(/\s+/).filter(word => word.length > 0).length;
};

export const getReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
};
