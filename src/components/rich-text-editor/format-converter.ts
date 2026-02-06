import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { marked } from 'marked';

/**
 * Format Converter Utility
 * 
 * Handles conversion between HTML and Markdown for the RichTextEditor.
 * 
 * Architecture (as of this update):
 * - TipTap editor stores content as **HTML** in product.description
 * - This eliminates the lossy markdown round-trip that caused:
 *   - Orphaned ** and _ markers
 *   - Lost underline formatting (<u> has no markdown equivalent)
 *   - Strikethrough rendering issues
 *   - Aggressive cleanMarkdown() regex breaking inline formatting
 * - For backward compatibility, all display points use descriptionToHtml()
 *   which auto-detects whether content is HTML or legacy markdown
 * 
 * Supports:
 * - HTML storage (new products)
 * - Legacy markdown rendering (existing products)
 * - Paste from Word, Google Docs, websites
 */

export type DetectedFormat = 'html' | 'markdown' | 'plain' | 'unknown';

export interface ConversionResult {
  markdown: string;
  detectedFormat: DetectedFormat;
  originalLength: number;
  convertedLength: number;
}

/**
 * Initialize Turndown service with GFM support
 */
const createTurndownService = (): TurndownService => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    preformattedCode: false,
  });

  // Add GitHub Flavored Markdown support (tables, strikethrough, task lists)
  turndownService.use(gfm);

  // Custom rules for better conversion
  // IMPORTANT: Rules are processed in order, so put wrapper rules FIRST
  
  // Handle Google Docs wrapper <b> tag with font-weight:normal
  // This MUST come first to prevent it from being processed as bold
  turndownService.addRule('googleDocsWrapper', {
    filter: (node) => {
      const nodeName = node.nodeName;
      const isB = nodeName === 'B' || nodeName === 'STRONG';
      
      if (!isB) return false;
      
      const style = node.getAttribute('style') || '';
      const hasNormalWeight = style.includes('font-weight:normal') || style.includes('font-weight: normal');
    
      return hasNormalWeight;
    },
    replacement: (content) => {
      // Just return content as-is, don't wrap in **
      return content;
    },
  });
  
  // Handle ALL spans with inline styles (Word/Google Docs often use this)
  // This must come BEFORE other rules to catch styled content
  turndownService.addRule('styledSpan', {
    filter: (node) => {
      if (node.nodeName !== 'SPAN') return false;
      const style = node.getAttribute('style') || '';
      const hasWeight = style.includes('font-weight');
      const hasStyle = style.includes('font-style');
      
      return hasWeight || hasStyle;
    },
    replacement: (content, node) => {
      if (!content.trim()) return content;
      
      const style = node.getAttribute('style') || '';
      let result = content;
      let applied = [];
      
      
      // Parse font-weight value from inline styles
      // Handles: font-weight:700, font-weight: 700, font-weight:bold, font-weight: bold
      const fontWeightMatch = style.match(/font-weight\s*:\s*(\d+|bold|bolder)/i);
      if (fontWeightMatch) {
        const weight = fontWeightMatch[1];
        // Bold if weight is 'bold', 'bolder', or >= 600
        if (weight === 'bold' || weight === 'bolder' || parseInt(weight) >= 600) {
          result = `**${result}**`;
          applied.push(`bold (weight: ${weight})`);
        }
      }
      
      // Parse font-style value from inline styles
      // Handles: font-style:italic, font-style: italic
      const fontStyleMatch = style.match(/font-style\s*:\s*(italic|oblique)/i);
      if (fontStyleMatch) {
        result = `_${result}_`;
        applied.push('italic');
      }
      
      return result;
    },
  });

  // Enhanced bold handling - catch all bold variants (except Google Docs wrapper handled above)
  turndownService.addRule('bold', {
    filter: (node) => {
      const nodeName = node.nodeName;
      const isB = nodeName === 'B' || nodeName === 'STRONG';
      
      
      
      return isB;
    },
    replacement: (content) => {
      if (!content.trim()) return content;
   
      return `**${content}**`;
    },
  });

  // Enhanced italic handling - catch all italic variants
  turndownService.addRule('italic', {
    filter: ['em', 'i'],
    replacement: (content) => {
      if (!content.trim()) return content;
      return `_${content}_`;
    },
  });

  // Preserve line breaks
  turndownService.addRule('lineBreak', {
    filter: 'br',
    replacement: () => '  \n',
  });

  // Handle div as paragraph
  turndownService.addRule('div', {
    filter: 'div',
    replacement: (content) => `\n${content}\n`,
  });

  // Handle regular span (preserve content, remove span)
  turndownService.addRule('span', {
    filter: (node) => {
      if (node.nodeName !== 'SPAN') return false;
      const style = node.getAttribute('style') || '';
      // Only handle spans without styling (styled ones handled above)
      return !style.includes('font-weight') && !style.includes('font-style');
    },
    replacement: (content) => content,
  });

  // Better handling of nested lists
  turndownService.addRule('nestedList', {
    filter: (node) => {
      return (
        (node.nodeName === 'UL' || node.nodeName === 'OL') &&
        node.parentNode?.nodeName === 'LI'
      );
    },
    replacement: (content) => `\n${content}`,
  });

  // Handle headings with proper spacing
  turndownService.addRule('headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (content, node) => {
      const level = parseInt(node.nodeName.charAt(1));
      const prefix = '#'.repeat(level);
      return `\n\n${prefix} ${content}\n\n`;
    },
  });

  // Handle paragraphs with proper spacing
  turndownService.addRule('paragraph', {
    filter: 'p',
    replacement: (content) => {
      if (!content.trim()) return '';
      return `\n\n${content}\n\n`;
    },
  });

  return turndownService;
};

/**
 * Detect the format of input text
 */
export const detectFormat = (text: string): DetectedFormat => {
  const trimmedText = text.trim();

  // Check for HTML tags
  if (/<[a-z][\s\S]*>/i.test(trimmedText)) {
    return 'html';
  }

  // Check for Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headings
    /\*\*.*\*\*/,  // Bold
    /_.*_/,        // Italic
    /^\s*[-*+]\s/m, // Unordered list
    /^\s*\d+\.\s/m, // Ordered list
    /\[.*\]\(.*\)/, // Links
    /`.*`/,        // Inline code
    /^```/m,       // Code blocks
  ];

  if (markdownPatterns.some(pattern => pattern.test(trimmedText))) {
    return 'markdown';
  }

  // Otherwise, treat as plain text
  return 'plain';
};

/**
 * Remove Google Docs wrapper <b> tag with font-weight:normal
 * This must be done BEFORE Turndown processes the HTML
 */
const removeGoogleDocsWrapper = (html: string): string => {
  // Match <b style="font-weight:normal;" ...> at the start and </b> at the end
  // Google Docs wraps entire content in this tag
  const wrapperPattern = /<b\s+style="font-weight:\s*normal;?"[^>]*>([\s\S]*)<\/b>\s*$/i;
  const match = html.match(wrapperPattern);
  
  if (match) {
    return match[1]; // Return content without wrapper
  }
  
  return html;
};

/**
 * Clean and normalize HTML before conversion
 */
const cleanHtml = (html: string): string => {
  // First, remove Google Docs wrapper
  let cleaned = removeGoogleDocsWrapper(html);
  
  // Remove Microsoft Word specific tags (but keep spans and styles for formatting!)
  cleaned = cleaned
    .replace(/<o:p>.*?<\/o:p>/gi, '') // Remove Office namespace tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n');

  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');

  // Remove multiple consecutive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

/**
 * Clean and normalize Markdown
 */
const cleanMarkdown = (markdown: string): string => {
  let cleaned = markdown
    // CRITICAL FIX: Trim spaces inside bold/italic markers FIRST
    .replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**')
    .replace(/\*\*\s+([^\*]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^\*]+?)\s+\*\*/g, '**$1**')
    .replace(/_\s+([^_]+?)\s+_/g, '_$1_')
    .replace(/_\s+([^_]+?)_/g, '_$1_')
    .replace(/_([^_]+?)\s+_/g, '_$1_')
    
    // CRITICAL FIX: Fix broken bold/italic markers split across lines
    .replace(/\*\*([^\*\n]+?)\n+\s*\*\*(?=\s*\n)/g, '**$1**\n\n')
    .replace(/_([^_\n]+?)\n+\s*_(?=\s*\n)/g, '_$1_\n\n')
    
    // NEW FIX: Separate bold/italic attached after punctuation (no space)
    // Matches: ).** or .** or word** → ).\n\n** or .\n\n** or word\n\n**
    .replace(/([).!?;:,])(\*\*[^\*]+\*\*)/g, '$1\n\n$2')
    .replace(/([).!?;:,])(_[^_]+_)/g, '$1\n\n$2')
    
    // NEW FIX: Separate bold/italic attached to any word character (catch-all)
    .replace(/([a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ])(\*\*[^\*]+\*\*)/g, '$1\n\n$2')
    .replace(/([a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ])(_[^_]+_)/g, '$1\n\n$2')
    
    // NEW FIX: Ensure proper spacing between inline formatting and list items
    .replace(/(\*\*[^\*\n]+\*\*)\s*(-|\d+\.)\s/g, '$1\n\n$2 ')
    .replace(/(_[^_\n]+_)\s*(-|\d+\.)\s/g, '$1\n\n$2 ')
    
    // Remove excessive line breaks (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    
    // Remove trailing spaces except those used for line breaks
    .replace(/[ \t]+$/gm, '')
    
    // Normalize list spacing
    .replace(/^([-*+]|\d+\.)\s+/gm, '$1 ')
    
    // Remove empty list items
    .replace(/^([-*+]|\d+\.)\s*$/gm, '');

  return cleaned.trim();
};


/**
 * Auto-format plain text (detect URLs, lists, etc.)
 */
const autoFormatPlainText = (text: string): string => {
  let formatted = text;

  // Convert URLs to Markdown links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '[$1]($1)'
  );

  // Detect and format lists (lines starting with - or *)
  const lines = formatted.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    // If line starts with - or * followed by space, ensure proper formatting
    if (/^[-*]\s/.test(trimmed)) {
      return `- ${trimmed.substring(2).trim()}`;
    }
    // If line starts with number followed by dot and space
    if (/^\d+\.\s/.test(trimmed)) {
      return trimmed;
    }
    return line;
  });

  formatted = formattedLines.join('\n');

  return formatted;
};

/**
 * Convert formatted text to Markdown
 */
export const convertToMarkdown = (text: string): ConversionResult => {
  const originalLength = text.length;
  const detectedFormat = detectFormat(text);

  let markdown = '';

  switch (detectedFormat) {
    case 'html': {
      const cleanedHTML = cleanHtml(text);
      const turndownService = createTurndownService();
      markdown = turndownService.turndown(cleanedHTML);
      markdown = cleanMarkdown(markdown);
      break;
    }

    case 'markdown': {
      // Already Markdown, just clean it
      markdown = cleanMarkdown(text);
      break;
    }

    case 'plain': {
      // Auto-format plain text
      markdown = autoFormatPlainText(text);
      markdown = cleanMarkdown(markdown);
      break;
    }

    default: {
      // Unknown format, treat as plain text
      markdown = text.trim();
      break;
    }
  }

  return {
    markdown,
    detectedFormat,
    originalLength,
    convertedLength: markdown.length,
  };
};

/**
 * Detect whether a string is HTML content (as opposed to markdown or plain text).
 * Used to determine how to render legacy vs new product descriptions.
 */
export const isHtml = (text: string): boolean => {
  if (!text || !text.trim()) return false;
  const trimmed = text.trim();
  // HTML content starts with a tag or contains common block-level HTML tags
  return /^<[a-z][^>]*>/i.test(trimmed) || 
    /<(p|h[1-6]|ul|ol|li|blockquote|pre|div|br|strong|em|u|s|del|a|table)\b/i.test(trimmed);
};

/**
 * Sanitize HTML from TipTap for safe storage.
 * Removes empty trailing paragraphs and normalizes whitespace.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || !html.trim()) return '';
  
  // TipTap uses <p></p> for empty content
  if (html === '<p></p>' || html === '<p><br></p>') return '';
  
  let cleaned = html;
  
  // Remove trailing empty paragraphs
  cleaned = cleaned.replace(/(<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '');
  
  // Remove leading empty paragraphs
  cleaned = cleaned.replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>)+/gi, '');
  
  return cleaned.trim();
};

/**
 * Convert a product description (HTML or legacy markdown) to safe HTML for display.
 * This is the single unified function all display points should use.
 * 
 * - If content is HTML (new products): sanitize and return as-is
 * - If content is markdown (legacy products): convert to HTML via marked
 */
export const descriptionToHtml = (content: string): string => {
  if (!content || !content.trim()) return '';
  
  if (isHtml(content)) {
    return sanitizeHtml(content);
  }
  
  // Legacy markdown content — convert to HTML
  try {
    const html = marked.parse(content, { async: false, gfm: true, breaks: true }) as string;
    return html;
  } catch (error) {
    console.error('Markdown to HTML conversion failed:', error);
    return content
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
};

/**
 * Convert Markdown string to HTML string.
 * Used to load markdown content into the TipTap WYSIWYG editor.
 * Also handles HTML content (passes through after sanitization).
 */
export const markdownToHtml = (content: string): string => {
  if (!content || !content.trim()) return '';
  
  // If already HTML, return as-is (TipTap can consume it directly)
  if (isHtml(content)) {
    return sanitizeHtml(content);
  }
  
  // Legacy markdown — convert to HTML for TipTap
  try {
    const html = marked.parse(content, { async: false, gfm: true, breaks: true }) as string;
    return html;
  } catch (error) {
    console.error('Markdown to HTML conversion failed:', error);
    return content
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
};

/**
 * Convert HTML string to Markdown string.
 * @deprecated - Kept for backward compatibility. New code should store HTML directly.
 */
export const htmlToMarkdown = (html: string): string => {
  if (!html || !html.trim()) return '';
  
  // TipTap uses <p></p> for empty content
  if (html === '<p></p>' || html === '<p><br></p>') return '';
  
  try {
    const turndownService = createTurndownService();
    let markdown = turndownService.turndown(html);
    markdown = cleanMarkdown(markdown);
    return markdown;
  } catch (error) {
    console.error('HTML to Markdown conversion failed:', error);
    // Fallback: strip HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  }
};

/**
 * Extract text from clipboard (handles both HTML and plain text)
 */
export const extractClipboardContent = async (): Promise<string> => {
  try {
    // Try to read from clipboard
    const clipboardItems = await navigator.clipboard.read();
    
    for (const item of clipboardItems) {
      // Try HTML first (preserves formatting)
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html');
        const html = await blob.text();
        return html;
      }
      
      // Fallback to plain text
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        return text;
      }
    }
    
    // If clipboard API doesn't work, try legacy method
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    throw new Error('Unable to read clipboard content. Please paste manually.');
  }
};

/**
 * Handle paste event and convert to Markdown
 */
export const handlePasteEvent = (event: ClipboardEvent): ConversionResult | null => {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return null;

  // Try to get HTML first (preserves formatting)
  const html = clipboardData.getData('text/html');
  if (html) {
    return convertToMarkdown(html);
  }

  // Fallback to plain text
  const text = clipboardData.getData('text/plain');
  if (text) {
    return convertToMarkdown(text);
  }

  return null;
};