export const parseKeywordsFromFile = (fileContent: string): string[] => {
  // Split by commas, semicolons, or new lines, then clean up
  return fileContent
    .split(/[,;\n\r]+/)
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0 && keyword.length < 100) // Reasonable length limits
    .slice(0, 100); // Limit to 100 keywords max
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      return false;
    }
  }
};

// Format-specific content formatters
export const formatWordPressContent = (title: string, body: string): string => {
  return `${title}\n\n${body}`;
};

export const formatShopifyContent = (title: string, body: string): string => {
  return `<h1>${title}</h1>\n\n${body}`;
};

export const formatGhostContent = (title: string, body: string): string => {
  return `# ${title}\n\n${body}`;
};

export const formatMediumContent = (title: string, body: string): string => {
  return `# ${title}\n\n${body}`;
};

export const formatHtmlContent = (title: string, body: string): string => {
  return `<h1>${title}</h1>\n\n${body}`;
};

export const formatMarkdownContent = (title: string, body: string): string => {
  return `# ${title}\n\n${body}`;
};

// Main formatter function that routes to appropriate formatter based on format
export const formatContent = (title: string, body: string, format: string): string => {
  switch (format) {
    case 'wordpress':
      return formatWordPressContent(title, body);
    case 'shopify':
      return formatShopifyContent(title, body);
    case 'ghost':
      return formatGhostContent(title, body);
    case 'medium':
      return formatMediumContent(title, body);
    case 'html':
      return formatHtmlContent(title, body);
    case 'markdown':
      return formatMarkdownContent(title, body);
    default:
      return formatWordPressContent(title, body);
  }
};

// Format content for copying (excludes TL;DR section)
export const formatContentForCopy = (title: string, body: string, format: string): string => {
  // Remove the introductory paragraph that serves as TL;DR
  // Look for the first heading (## or ###) and start content from there
  const headingMatch = body.match(/(##[^\n]+[\s\S]*)/);  
  const cleanBody = headingMatch ? headingMatch[1] : body;
  
  return formatContent(title, cleanBody, format);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = ['text/plain', 'text/csv', 'application/csv', 'text/comma-separated-values'];
  const allowedExtensions = ['.txt', '.csv'];
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return hasValidType || hasValidExtension;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
