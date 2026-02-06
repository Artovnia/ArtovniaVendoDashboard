import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Label } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EmojiPicker } from './emoji-picker';
import { markdownToHtml, sanitizeHtml } from './format-converter';
import './rich-text-editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  optional?: boolean;
  error?: string;
}

/**
 * Rich Text Editor Component — TipTap WYSIWYG
 * 
 * A true WYSIWYG editor for vendor product descriptions. Users see formatted
 * text directly as they type (like MS Word) — no markdown syntax knowledge needed.
 * 
 * Architecture:
 * - TipTap (ProseMirror) provides the WYSIWYG editing experience
 * - Content is stored as **HTML** in product.description (lossless)
 * - On mount: content (HTML or legacy markdown) → TipTap editor
 * - On change: TipTap HTML → sanitized HTML → form value
 * - Legacy markdown descriptions are auto-converted to HTML on load
 * - Paste from Word/Google Docs handled natively by TipTap
 * 
 * Why HTML instead of Markdown:
 * - Markdown has no equivalent for <u> (underline) — was silently dropped
 * - Turndown's cleanMarkdown() regex was breaking inline bold/italic markers
 * - Strikethrough (~~) required GFM support at every display point
 * - HTML storage = perfect fidelity: what you see in editor = what renders everywhere
 * 
 * Features:
 * - Live WYSIWYG formatting (bold, italic, underline, strikethrough, headings, lists, etc.)
 * - Toolbar with active-state indicators
 * - Native paste handling for Word, Google Docs, websites
 * - Emoji picker
 * - Undo/Redo support
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Y)
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  
  // Track whether the current value change originated from the editor itself
  // to prevent feedback loops when syncing external value changes
  const isInternalChange = useRef(false);

  const effectivePlaceholder = placeholder || t('richtext.placeholder');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: effectivePlaceholder,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Underline,
    ],
    content: markdownToHtml(value),
    onUpdate: ({ editor: updatedEditor }) => {
      isInternalChange.current = true;
      const html = updatedEditor.getHTML();
      const cleaned = sanitizeHtml(html);
      onChange(cleaned);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  });

  // Sync external value changes (form reset, import modal) into the editor.
  // Skip when the change originated from the editor itself (isInternalChange).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const html = markdownToHtml(value);
    editor.commands.setContent(html, { emitUpdate: false });
  }, [value, editor]);

  // Helper: isolate selected text into its own paragraph before applying block-level format.
  // Block-level formats (heading, list, blockquote) apply to entire paragraphs by design.
  // When user selects only part of a paragraph, this splits the paragraph first
  // so the format applies only to the selected portion.
  const splitSelectionIntoOwnBlock = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    
    const $from = editor.state.doc.resolve(from);
    const $to = editor.state.doc.resolve(to);
    
    if (!$from.sameParent($to) || $from.parent.type.name !== 'paragraph') return;
    
    const blockStart = $from.start($from.depth);
    const blockEnd = $from.end($from.depth);
    
    if (from <= blockStart && to >= blockEnd) return;
    
    // Split at end of selection first (positions before it stay valid)
    if (to < blockEnd) {
      editor.chain().focus().setTextSelection(to).splitBlock().run();
    }
    // Split at start of selection
    if (from > blockStart) {
      editor.chain().focus().setTextSelection(from).splitBlock().run();
    }
  }, [editor]);

  // Heading cycling: normal → H2 → H3 → H4 → normal
  const toggleHeading = useCallback(() => {
    if (!editor) return;
    splitSelectionIntoOwnBlock();
    if (editor.isActive('heading', { level: 2 })) {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (editor.isActive('heading', { level: 3 })) {
      editor.chain().focus().toggleHeading({ level: 4 }).run();
    } else if (editor.isActive('heading', { level: 4 })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  }, [editor, splitSelectionIntoOwnBlock]);

  // Link insertion via prompt
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Block-format toggles with smart splitting
  const toggleBulletList = useCallback(() => {
    if (!editor) return;
    splitSelectionIntoOwnBlock();
    editor.chain().focus().toggleBulletList().run();
  }, [editor, splitSelectionIntoOwnBlock]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) return;
    splitSelectionIntoOwnBlock();
    editor.chain().focus().toggleOrderedList().run();
  }, [editor, splitSelectionIntoOwnBlock]);

  const toggleBlockquote = useCallback(() => {
    if (!editor) return;
    splitSelectionIntoOwnBlock();
    editor.chain().focus().toggleBlockquote().run();
  }, [editor, splitSelectionIntoOwnBlock]);

  // Emoji insertion into TipTap
  const insertEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  }, [editor]);

  // Get heading label for toolbar button
  const getHeadingLabel = (): string => {
    if (!editor) return 'H';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    if (editor.isActive('heading', { level: 4 })) return 'H4';
    return 'H';
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
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 p-2 border border-ui-border-base rounded-t-lg bg-ui-bg-subtle">
        {/* Text formatting */}
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant={editor?.isActive('bold') ? 'primary' : 'secondary'}
            size="small"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title={t('richtext.toolbar.bold') + ' (Ctrl+B)'}
            className="px-2 py-1 text-xs"
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('italic') ? 'primary' : 'secondary'}
            size="small"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title={t('richtext.toolbar.italic') + ' (Ctrl+I)'}
            className="px-2 py-1 text-xs"
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('underline') ? 'primary' : 'secondary'}
            size="small"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
            className="px-2 py-1 text-xs"
          >
            <u>U</u>
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('strike') ? 'primary' : 'secondary'}
            size="small"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            title="Strikethrough"
            className="px-2 py-1 text-xs"
          >
            <s>S</s>
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* Heading */}
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant={editor?.isActive('heading') ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleHeading}
            title={t('richtext.toolbar.heading')}
            className="px-2 py-1 text-xs"
          >
            {getHeadingLabel()}
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* Lists */}
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant={editor?.isActive('bulletList') ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleBulletList}
            title={t('richtext.toolbar.bulletList')}
            className="px-2 py-1 text-xs"
          >
            •
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('orderedList') ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleOrderedList}
            title={t('richtext.toolbar.numberedList')}
            className="px-2 py-1 text-xs"
          >
            1.
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* Block formatting & links */}
        <div className="flex items-center gap-x-1">
          <Button
            type="button"
            variant={editor?.isActive('blockquote') ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleBlockquote}
            title="Blockquote"
            className="px-2 py-1 text-xs"
          >
            &ldquo;
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('codeBlock') ? 'primary' : 'secondary'}
            size="small"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title={t('richtext.toolbar.code')}
            className="px-2 py-1 text-xs"
          >
            {'</>'}
          </Button>
          <Button
            type="button"
            variant={editor?.isActive('link') ? 'primary' : 'secondary'}
            size="small"
            onClick={setLink}
            title={t('richtext.toolbar.link')}
            className="px-2 py-1 text-xs"
          >
            🔗
          </Button>
        </div>

        <div className="w-px h-6 bg-ui-border-base" />

        {/* Emoji */}
        <div className="flex items-center gap-x-1">
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
        </div>

        {/* Undo/Redo */}
        <div className="ml-auto flex items-center gap-x-1">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            title="Undo (Ctrl+Z)"
            className="px-2 py-1 text-xs"
          >
            ↩
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            title="Redo (Ctrl+Y)"
            className="px-2 py-1 text-xs"
          >
            ↪
          </Button>
        </div>
      </div>

      {/* WYSIWYG Editor Area */}
      <div className="rich-text-editor-wrap border border-t-0 border-ui-border-base rounded-b-lg bg-ui-bg-base overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      {error && (
        <p className="text-ui-fg-error txt-compact-small">{error}</p>
      )}

    </div>
  );
};
