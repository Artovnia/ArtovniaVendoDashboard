import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export const RichTextEditor = ({ value, onChange, placeholder, rows = 6 }: RichTextEditorProps) => {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const insertFormatting = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    const newText = beforeText + before + selectedText + after + afterText
    onChange(newText)

    // Set cursor position after formatting
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, onChange])

  const insertList = useCallback((prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    // If text is selected, convert each line to list item
    if (selectedText) {
      const lines = selectedText.split('\n')
      const listItems = lines.map(line => line.trim() ? `${prefix} ${line.trim()}` : '').join('\n')
      const newText = beforeText + listItems + afterText
      onChange(newText)
    } else {
      // Insert new list item at cursor
      const newText = beforeText + `${prefix} ` + afterText
      onChange(newText)
      setTimeout(() => {
        const newCursorPos = start + prefix.length + 1
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      insertFormatting('  ')
    }
  }, [insertFormatting])

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className={`flex flex-wrap gap-1 p-2 bg-ui-bg-subtle rounded-t border border-ui-border-base ${
        isFocused ? 'border-ui-border-interactive' : ''
      }`}>
        <button
          type="button"
          onClick={() => insertFormatting('**', '**')}
          className="px-3 py-1 text-sm font-bold bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.bold')}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('*', '*')}
          className="px-3 py-1 text-sm italic bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.italic')}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('~~', '~~')}
          className="px-3 py-1 text-sm line-through bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.strikethrough')}
        >
          S
        </button>
        
        <div className="w-px h-6 bg-ui-border-base mx-1" />
        
        <button
          type="button"
          onClick={() => insertList('-')}
          className="px-3 py-1 text-sm bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.bulletList')}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => insertList('1.')}
          className="px-3 py-1 text-sm bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.numberedList')}
        >
          1. List
        </button>
        
        <div className="w-px h-6 bg-ui-border-base mx-1" />
        
        <button
          type="button"
          onClick={() => insertFormatting('## ', '')}
          className="px-3 py-1 text-sm font-semibold bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.heading2')}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('### ', '')}
          className="px-3 py-1 text-sm font-medium bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.heading3')}
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-ui-border-base mx-1" />
        
        <button
          type="button"
          onClick={() => insertFormatting('[', '](url)')}
          className="px-3 py-1 text-sm bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.link')}
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('> ', '')}
          className="px-3 py-1 text-sm bg-ui-bg-base hover:bg-ui-bg-base-hover rounded border border-ui-border-base"
          title={t('pagebuilder.blockForm.richTextEditor.quote')}
        >
          " Quote
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 rounded-b border border-t-0 border-ui-border-base ${
          isFocused ? 'border-ui-border-interactive' : ''
        } focus:outline-none focus:border-ui-border-interactive resize-y font-mono text-sm`}
      />

      {/* Help text */}
      <div className="text-xs text-ui-fg-subtle space-y-1">
        <p><strong>{t('pagebuilder.blockForm.richTextEditor.formattingTips')}</strong></p>
        <p>• {t('pagebuilder.blockForm.richTextEditor.tipBold')} • {t('pagebuilder.blockForm.richTextEditor.tipItalic')} • {t('pagebuilder.blockForm.richTextEditor.tipStrikethrough')}</p>
        <p>• {t('pagebuilder.blockForm.richTextEditor.tipBulletList')} • {t('pagebuilder.blockForm.richTextEditor.tipNumberedList')}</p>
        <p>• {t('pagebuilder.blockForm.richTextEditor.tipHeading')} • {t('pagebuilder.blockForm.richTextEditor.tipSubheading')}</p>
        <p>• {t('pagebuilder.blockForm.richTextEditor.tipLink')} • {t('pagebuilder.blockForm.richTextEditor.tipQuote')}</p>
      </div>
    </div>
  )
}
