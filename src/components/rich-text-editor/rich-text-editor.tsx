import { useState, useCallback, useRef } from 'react';
import { Textarea, Button, Label } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { EmojiPicker } from './emoji-picker';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  optional?: boolean;
  error?: string;
}

/**
 * Rich Text Editor Component
 * 
 * A Markdown-based editor that allows vendors to format product descriptions
 * without requiring a CMS. Follows Medusa's pattern of storing formatted content
 * as strings that can be rendered on the storefront.
 * 
 * Features:
 * - Live preview of formatted text
 * - Markdown toolbar for common formatting
 * - Split view (edit/preview) or single view
 * - Stores content as Markdown string in product.description
 * 
 * Usage:
 * ```tsx
 * <RichTextEditor
 *   value={form.watch('description')}
 *   onChange={(value) => form.setValue('description', value)}
 *   label="Product Description"
 * />
 * ```
 */
export const RichTextEditor = ({
  value = '',
  onChange,
  placeholder,
  label,
  optional = false,
  error,
}: RichTextEditorProps) => {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Use translation for placeholder if not provided
  const effectivePlaceholder = placeholder || t('richtext.placeholder');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Helper to get current line info
  const getCurrentLineInfo = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const start = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, start);
    const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const textAfterCursor = value.substring(start);
    const lineEnd = textAfterCursor.indexOf('\n');
    const actualLineEnd = lineEnd === -1 ? value.length : start + lineEnd;
    const currentLine = value.substring(lineStart, actualLineEnd);

    return { lineStart, lineEnd: actualLineEnd, currentLine, cursorPos: start };
  }, [value]);

  // Insert text at cursor position (for inline formatting)
  const insertAtCursor = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || placeholder;
      const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      
      onChange(newText);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  // Format current line (for headings, lists)
  const formatCurrentLine = useCallback(
    (prefix: string) => {
      const lineInfo = getCurrentLineInfo();
      if (!lineInfo) return;

      const { lineStart, lineEnd, currentLine, cursorPos } = lineInfo;
      
      // Check if line already has this prefix
      const trimmedLine = currentLine.trimStart();
      const hasPrefix = trimmedLine.startsWith(prefix);
      
      let newLine: string;
      let cursorOffset: number;
      
      if (hasPrefix) {
        // Remove prefix
        newLine = trimmedLine.substring(prefix.length);
        cursorOffset = -prefix.length;
      } else {
        // Add prefix
        newLine = prefix + trimmedLine;
        cursorOffset = prefix.length;
      }
      
      const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd);
      onChange(newText);

      // Restore cursor position
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const newCursorPos = Math.max(lineStart, cursorPos + cursorOffset);
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, onChange, getCurrentLineInfo]
  );

  const formatBold = () => insertAtCursor('**', '**', 'Twój tekst');
  const formatItalic = () => insertAtCursor('_', '_', 'Twój tekst');
  const formatHeading = () => formatCurrentLine('## Twój nagłówek');
  const formatList = () => formatCurrentLine('- Twój tekst ');
  const formatNumberedList = () => formatCurrentLine('1. Twój tekst ');
  const formatLink = () => insertAtCursor('[', '](url)', 'Twój link');
  const formatCode = () => insertAtCursor('`', '`', 'code');
  const formatStrikethrough = () => insertAtCursor('~~', '~~', 'strikethrough text');
  const formatBlockquote = () => formatCurrentLine('> ');
  const formatTaskList = () => formatCurrentLine('- [ ] ');
  const formatTable = () => {
    const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + tableTemplate + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tableTemplate.length, start + tableTemplate.length);
    }, 0);
  };
  
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col gap-y-2">
      {label && (
        <div className="flex items-center gap-x-1">
          <Label className="text-ui-fg-subtle txt-compact-medium-plus">
            {label}
          </Label>
          {optional && (
            <span className="text-ui-fg-muted txt-compact-small">({t('richtext.label.optional')})</span>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-x-2 p-2 border border-ui-border-base rounded-t-lg bg-ui-bg-subtle">
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatBold}
            title={t('richtext.toolbar.bold')}
            className="px-2 py-1 text-xs"
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatItalic}
            title={t('richtext.toolbar.italic')}
            className="px-2 py-1 text-xs"
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatHeading}
            title={t('richtext.toolbar.heading')}
            className="px-2 py-1 text-xs"
          >
            H
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatList}
            title={t('richtext.toolbar.bulletList')}
            className="px-2 py-1 text-xs"
          >
            •
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatNumberedList}
            title={t('richtext.toolbar.numberedList')}
            className="px-2 py-1 text-xs"
          >
            1.
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatLink}
            title={t('richtext.toolbar.link')}
            className="px-2 py-1 text-xs"
          >
            🔗
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatCode}
            title={t('richtext.toolbar.code')}
            className="px-2 py-1 text-xs"
          >
            {'</>'}
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* New formatting buttons */}
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatStrikethrough}
            title="Strikethrough"
            className="px-2 py-1 text-xs"
          >
            <s>S</s>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatBlockquote}
            title="Blockquote"
            className="px-2 py-1 text-xs"
          >
            "
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatTaskList}
            title="Task List"
            className="px-2 py-1 text-xs"
          >
            ☑
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={formatTable}
            title="Insert Table"
            className="px-2 py-1 text-xs"
          >
            ⊞
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* Emoji picker */}
        <div className="relative">
          <Button
            ref={emojiButtonRef}
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert Emoji"
            className="px-2 py-1 text-xs"
          >
            😊
          </Button>
          
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={insertEmoji}
              onClickOutside={() => setShowEmojiPicker(false)}
              buttonRef={emojiButtonRef}
            />
          )}
        </div>

        <div className="ml-auto">
          <Button
            type="button"
            variant={showPreview ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 text-xs"
          >
            {showPreview ? t('richtext.toolbar.edit') : t('richtext.toolbar.preview')}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {!showPreview ? (
          <Textarea
            ref={textareaRef}
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={effectivePlaceholder}
            rows={12}
            className="font-mono text-sm rounded-t-none"
            onKeyDown={(e) => {
              // Keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                  e.preventDefault();
                  formatBold();
                } else if (e.key === 'i') {
                  e.preventDefault();
                  formatItalic();
                }
              }
            }}
          />
        ) : (
          <div className="min-h-[300px] p-4 border border-ui-border-base rounded-b-lg bg-ui-bg-base prose prose-sm max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-3" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-ui-border-strong pl-4 italic my-4 text-ui-fg-subtle" {...props} />
                ),
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-ui-border-base" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-ui-bg-subtle" {...props} />,
                th: ({node, ...props}) => (
                  <th className="border border-ui-border-base px-4 py-2 text-left font-semibold" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="border border-ui-border-base px-4 py-2" {...props} />
                ),
                del: ({node, ...props}) => <del className="text-ui-fg-muted" {...props} />,
                input: ({node, ...props}) => {
                  // Task list checkbox
                  if (props.type === 'checkbox') {
                    return <input type="checkbox" disabled className="mr-2" {...props} />;
                  }
                  return <input {...props} />;
                },
              }}
            >
              {value || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Markdown Help */}
      <details className="text-xs text-ui-fg-subtle">
        <summary className="cursor-pointer hover:text-ui-fg-base">
          {t('richtext.help.title')}
        </summary>
        <div className="mt-2 p-3 bg-ui-bg-subtle rounded border border-ui-border-base space-y-1">
          <p><strong>**{t('richtext.help.bold')}**</strong> → <strong>{t('richtext.help.bold')}</strong></p>
          <p><em>_{t('richtext.help.italic')}_</em> → <em>{t('richtext.help.italic')}</em></p>
          <p>## {t('richtext.help.heading')} → <strong>{t('richtext.help.heading')}</strong></p>
          <p>- {t('richtext.help.bulletList')} → • {t('richtext.help.bulletList')}</p>
          <p>1. {t('richtext.help.numberedList')} → 1. {t('richtext.help.numberedList')}</p>
          <p>[{t('richtext.help.link')}](url) → <span className="text-blue-600">{t('richtext.help.link')}</span></p>
          <p>`{t('richtext.help.code')}` → <code className="bg-gray-100 px-1">{t('richtext.help.code')}</code></p>
          <p>~~{t('richtext.help.strikethrough')}~~ → <del>{t('richtext.help.strikethrough')}</del></p>
          <p>&gt; {t('richtext.help.blockquote')} → <span className="italic text-ui-fg-subtle">{t('richtext.help.blockquote')}</span></p>
          <p>- [ ] {t('richtext.help.taskList')} → ☐ {t('richtext.help.taskList')}</p>
          <p className="mt-2 pt-2 border-t border-ui-border-base"><strong>{t('richtext.help.lineBreaks')}</strong> {t('richtext.help.lineBreaksHint')}</p>
        </div>
      </details>

      {error && (
        <p className="text-ui-fg-error txt-compact-small">{error}</p>
      )}
    </div>
  );
};
