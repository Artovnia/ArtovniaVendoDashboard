import { useState, useCallback, useRef } from 'react';
import { Button, Label, Badge, Text, Textarea } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { FocusModal } from '@medusajs/ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  convertToMarkdown,
  extractClipboardContent,
  DetectedFormat,
  ConversionResult,
} from '../../rich-text-editor/format-converter';

interface ImportFormattedTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (markdown: string, mode: 'replace' | 'append' | 'insert') => void;
  currentContent?: string;
}

type ImportMode = 'replace' | 'append' | 'insert';

const formatBadgeColor = (format: DetectedFormat): string => {
  switch (format) {
    case 'html':
      return 'bg-blue-100 text-blue-700';
    case 'markdown':
      return 'bg-green-100 text-green-700';
    case 'plain':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-orange-100 text-orange-700';
  }
};

export const ImportFormattedTextModal = ({
  open,
  onOpenChange,
  onImport,
  currentContent = '',
}: ImportFormattedTextModalProps) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState<string>('');
  const [rawHtml, setRawHtml] = useState<string>(''); // Store raw HTML from paste
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const handleConvert = useCallback(() => {
    // Use raw HTML if available, otherwise use plain text
    const contentToConvert = rawHtml || inputText;
    if (!contentToConvert.trim()) return;

    setIsProcessing(true);
    try {
     
      const result = convertToMarkdown(contentToConvert);
      
      setConversionResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('❌ Conversion error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, rawHtml]);

  const handlePasteFromClipboard = useCallback(async () => {
    setIsProcessing(true);
    try {
      const clipboardContent = await extractClipboardContent();

      // Store both HTML and text
      setRawHtml(clipboardContent);
      
      // Extract plain text for display
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = clipboardContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      setInputText(plainText);
      
      // Auto-convert after pasting
      const result = convertToMarkdown(clipboardContent);
   
      setConversionResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Clipboard error:', error);
      alert(t('richtext.import.clipboardError'));
    } finally {
      setIsProcessing(false);
    }
  }, [t]);

  const handleImport = useCallback(() => {
    if (!conversionResult) return;

    onImport(conversionResult.markdown, importMode);
    
    // Reset state
    setInputText('');
    setConversionResult(null);
    setShowPreview(false);
    onOpenChange(false);
  }, [conversionResult, importMode, onImport, onOpenChange]);

  const handleCancel = useCallback(() => {
    setInputText('');
    setRawHtml('');
    setConversionResult(null);
    setShowPreview(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle paste event in the contentEditable div
  const handlePasteInDiv = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Try to get HTML first (preserves formatting)
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    
    
    if (html) {
      setRawHtml(html);
      // Show plain text in the display area
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      setInputText(plainText);
      
      // Insert plain text into contentEditable
      if (pasteAreaRef.current) {
        pasteAreaRef.current.textContent = plainText;
      }
    } else if (text) {
      setRawHtml('');
      setInputText(text);
      
      // Insert plain text into contentEditable
      if (pasteAreaRef.current) {
        pasteAreaRef.current.textContent = text;
      }
    }
  }, []);

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between">
            <div>
              <FocusModal.Title>
                {t('richtext.import.title')}
              </FocusModal.Title>
              <FocusModal.Description>
                {t('richtext.import.description')}
              </FocusModal.Description>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="flex flex-col gap-y-4 px-6 py-4">
          {/* Input Section */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-ui-fg-subtle txt-compact-medium-plus">
                {t('richtext.import.inputLabel')}
              </Label>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={handlePasteFromClipboard}
                disabled={isProcessing}
              >
                📋 {t('richtext.import.pasteFromClipboard')}
              </Button>
            </div>
            
            {/* ContentEditable div to capture HTML from paste */}
            <div
              ref={pasteAreaRef}
              contentEditable
              onPaste={handlePasteInDiv}
              onInput={(e) => {
                const text = e.currentTarget.textContent || '';
                setInputText(text);
              }}
              className="min-h-[200px] p-4 border border-ui-border-base rounded-lg bg-ui-bg-field font-mono text-sm focus:outline-none focus:border-ui-border-interactive overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-ui-fg-muted"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              data-placeholder={t('richtext.import.inputPlaceholder')}
              suppressContentEditableWarning
            />
            
            {/* Hint text */}
            {!inputText && (
              <Text size="small" className="text-ui-fg-muted -mt-1">
                💡 {t('richtext.import.pasteHint')}
              </Text>
            )}

            {inputText && (
              <div className="flex items-center justify-between">
                <Text size="small" className="text-ui-fg-subtle">
                  {inputText.length} {t('richtext.import.characters')}
                </Text>
                <Button
                  type="button"
                  variant="primary"
                  size="small"
                  onClick={handleConvert}
                  disabled={isProcessing || !inputText.trim()}
                >
                  {t('richtext.import.convert')}
                </Button>
              </div>
            )}
          </div>

          {/* Conversion Result */}
          {conversionResult && (
            <>
              <div className="border-t border-ui-border-base pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-x-2">
                    <Label className="text-ui-fg-subtle txt-compact-medium-plus">
                      {t('richtext.import.result')}
                    </Label>
                    <Badge className={formatBadgeColor(conversionResult.detectedFormat)}>
                      {t(`richtext.import.format.${conversionResult.detectedFormat}`)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant={showPreview ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? t('richtext.toolbar.edit') : t('richtext.toolbar.preview')}
                  </Button>
                </div>

                {!showPreview ? (
                  <Textarea
                    value={conversionResult.markdown}
                    onChange={(e) =>
                      setConversionResult({
                        ...conversionResult,
                        markdown: e.target.value,
                      })
                    }
                    rows={10}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 border border-ui-border-base rounded-lg bg-ui-bg-base prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2 mt-4" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-3" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-4" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-ui-border-strong pl-4 italic my-4 text-ui-fg-subtle" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-ui-border-base" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-ui-bg-subtle" {...props} />,
                        th: ({ node, ...props }) => (
                          <th className="border border-ui-border-base px-4 py-2 text-left font-semibold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-ui-border-base px-4 py-2" {...props} />
                        ),
                        del: ({ node, ...props }) => <del className="text-ui-fg-muted" {...props} />,
                      }}
                    >
                      {conversionResult.markdown || '*No content*'}
                    </ReactMarkdown>
                  </div>
                )}

                <Text size="small" className="text-ui-fg-subtle mt-2">
                  {conversionResult.convertedLength} {t('richtext.import.characters')}
                </Text>
              </div>

              {/* Import Mode Selection */}
              <div className="flex flex-col gap-y-2">
                <Label className="text-ui-fg-subtle txt-compact-medium-plus">
                  {t('richtext.import.modeLabel')}
                </Label>
                <div className="flex gap-x-2">
                  <Button
                    type="button"
                    variant={importMode === 'replace' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setImportMode('replace')}
                  >
                    {t('richtext.import.mode.replace')}
                  </Button>
                  <Button
                    type="button"
                    variant={importMode === 'append' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setImportMode('append')}
                    disabled={!currentContent}
                  >
                    {t('richtext.import.mode.append')}
                  </Button>
                  <Button
                    type="button"
                    variant={importMode === 'insert' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setImportMode('insert')}
                  >
                    {t('richtext.import.mode.insert')}
                  </Button>
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {t(`richtext.import.mode.${importMode}Hint`)}
                </Text>
              </div>
            </>
          )}
        </FocusModal.Body>

        <FocusModal.Footer>
          <div className="flex items-center justify-end gap-x-3 px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              disabled={!conversionResult}
            >
              {t('richtext.import.importButton')}
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};
