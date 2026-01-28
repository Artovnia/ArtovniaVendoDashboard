import { useTranslation } from 'react-i18next'
import { Block, VendorPageSettings } from '../../../hooks/api/vendor-page'
import { BlockPreview } from './block-preview'

interface LivePreviewProps {
  blocks: Block[]
  settings: VendorPageSettings
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string) => void
}

export const LivePreview = ({ 
  blocks, 
  settings,
  selectedBlockId,
  onBlockSelect 
}: LivePreviewProps) => {
  const { t } = useTranslation()
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)
  const animationSetting = settings.animations || 'subtle'

  return (
    <div className="bg-white rounded-lg border border-ui-border-base overflow-hidden">
      {/* Preview Header - mimics storefront header */}
      <div className="bg-ui-bg-subtle border-b border-ui-border-base px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-ui-bg-base border"></div>
            <div>
              <div className="h-3 w-24 bg-ui-bg-base rounded"></div>
              <div className="h-2 w-16 bg-ui-bg-base rounded mt-1"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-ui-bg-base rounded text-xs font-medium text-ui-fg-subtle">
              {t('pagebuilder.preview.history')}
            </div>
            <div className="px-3 py-1.5 rounded text-xs text-ui-fg-muted">
              {t('pagebuilder.preview.products')}
            </div>
            <div className="px-3 py-1.5 rounded text-xs text-ui-fg-muted">
              {t('pagebuilder.preview.reviews')}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-[#F4F0EB]">
        {sortedBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg className="w-16 h-16 text-ui-fg-subtle mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-ui-fg-subtle font-medium mb-1">{t('pagebuilder.preview.emptyTitle')}</p>
            <p className="text-ui-fg-muted text-sm">{t('pagebuilder.preview.emptyDescription')}</p>
          </div>
        ) : (
          <>
            {animationSetting !== 'none' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">{t('pagebuilder.preview.animationsNotice')}</p>
                    <p className="text-blue-700 text-xs" dangerouslySetInnerHTML={{ 
                      __html: t('pagebuilder.preview.animationsSelected', { 
                        type: animationSetting === 'subtle' ? t('pagebuilder.settings.animationSubtle') : t('pagebuilder.settings.animationExpressive')
                      })
                    }} />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {sortedBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`relative rounded-lg transition-all duration-200 ${
                    selectedBlockId === block.id 
                      ? 'ring-2 ring-ui-border-interactive ring-offset-2' 
                      : 'hover:ring-1 hover:ring-ui-border-base'
                  }`}
                  onClick={() => onBlockSelect?.(block.id)}
                >
                  {selectedBlockId === block.id && (
                    <div className="absolute -top-2 -left-2 z-10 px-2 py-0.5 bg-ui-bg-interactive text-white text-xs rounded font-medium">
                      {t('pagebuilder.preview.edited')}
                    </div>
                  )}
                  <BlockPreview block={block} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview Footer */}
      <div className="bg-ui-bg-subtle border-t border-ui-border-base px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ui-fg-subtle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t('pagebuilder.preview.livePreview').replace('📱 ', '')}
        </div>
        <div className="text-xs text-ui-fg-muted">
          {t('pagebuilder.preview.blockCount', { count: blocks.length })}
        </div>
      </div>
    </div>
  )
}
