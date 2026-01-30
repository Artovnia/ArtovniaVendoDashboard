import { useState } from 'react'
import { Button, Container, Heading, Text, IconButton, DropdownMenu } from '@medusajs/ui'
import { Plus, Trash } from '@medusajs/icons'
import { useTranslation } from 'react-i18next'
import { Block } from '../../../hooks/api/vendor-page'
import { BlockForm } from './block-forms/block-form'

interface BlockEditorProps {
  blocks: Block[]
  allowedBlocks: string[]
  onBlocksChange: (blocks: Block[]) => void
  onAddBlock: (type: string) => void
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string | null) => void
}

const BLOCK_EMOJIS: Record<string, string> = {
  hero: '🖼️',
  rich_text: '📝',
  image_gallery: '🖼️',
  image_text: '📷',
  quote: '💬',
  video: '🎬',
  process: '📋',
  featured_products: '🛍️',
  timeline: '📅',
  team: '👥',
  categories: '🏷️',
  spacer: '📏',
}

const ArrowUpIcon = () => <span className="text-lg">↑</span>
const ArrowDownIcon = () => <span className="text-lg">↓</span>

export const BlockEditor = ({ 
  blocks, 
  allowedBlocks, 
  onBlocksChange, 
  onAddBlock,
  selectedBlockId,
  onBlockSelect
}: BlockEditorProps) => {
  const { t } = useTranslation()
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index - 1]
    newBlocks[index - 1] = temp
    // Update order values
    newBlocks.forEach((block, i) => {
      block.order = i
    })
    onBlocksChange(newBlocks)
  }

  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + 1]
    newBlocks[index + 1] = temp
    // Update order values
    newBlocks.forEach((block, i) => {
      block.order = i
    })
    onBlocksChange(newBlocks)
  }

  const handleDelete = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index)
    newBlocks.forEach((block, i) => {
      block.order = i
    })
    onBlocksChange(newBlocks)
  }

  const handleBlockUpdate = (index: number, data: any) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], data }
    onBlocksChange(newBlocks)
  }

  const toggleExpand = (blockId: string) => {
    const newExpanded = expandedBlock === blockId ? null : blockId
    setExpandedBlock(newExpanded)
    // Sync with parent selection
    onBlockSelect?.(newExpanded)
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <Heading level="h2">{t('pagebuilder.blocks.title')}</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            {t('pagebuilder.blocks.description')}
          </Text>
        </div>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" size="small">
              <Plus className="mr-1" />
              {t('pagebuilder.blocks.addBlock')}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {allowedBlocks.map((blockType) => {
              const emoji = BLOCK_EMOJIS[blockType]
              return (
                <DropdownMenu.Item
                  key={blockType}
                  onClick={() => onAddBlock(blockType)}
                >
                  <span className="mr-2">{emoji || '📄'}</span>
                  {t(`pagebuilder.blocks.${blockType}`)}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {blocks.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text className="text-ui-fg-subtle">
            {t('pagebuilder.blocks.noBlocks')}
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {blocks.map((block, index) => {
            const emoji = BLOCK_EMOJIS[block.type]
            const isExpanded = expandedBlock === block.id
            const isSelected = selectedBlockId === block.id

            return (
              <div 
                key={block.id} 
                className={`px-6 py-4 transition-colors ${isSelected ? 'bg-ui-bg-subtle-hover' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => toggleExpand(block.id)}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${isSelected ? 'bg-ui-bg-interactive text-white' : 'bg-ui-bg-subtle'}`}>
                      {emoji || '📄'}
                    </div>
                    <div>
                      <Text className="font-medium">
                        {t(`pagebuilder.blocks.${block.type}`)}
                      </Text>
                      <Text className="text-ui-fg-subtle text-xs">
                        {getBlockPreview(block, t)}
                      </Text>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <IconButton
                      variant="transparent"
                      size="small"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUpIcon />
                    </IconButton>
                    <IconButton
                      variant="transparent"
                      size="small"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === blocks.length - 1}
                    >
                      <ArrowDownIcon />
                    </IconButton>
                    <IconButton
                      variant="transparent"
                      size="small"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash />
                    </IconButton>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-11">
                    <BlockForm
                      block={block}
                      onUpdate={(data) => handleBlockUpdate(index, data)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}

function getBlockPreview(block: Block, t: any): string {
  switch (block.type) {
    case 'hero':
      return block.data.title || t('pagebuilder.blockPreview.noTitle')
    case 'rich_text':
      return block.data.content?.substring(0, 50) || t('pagebuilder.blockPreview.noContent')
    case 'image_gallery':
      return `${block.data.images?.length || 0} ${t('pagebuilder.blockPreview.addPhotos').toLowerCase()}`
    case 'image_text':
      return block.data.title || t('pagebuilder.blockPreview.noTitle')
    case 'quote':
      return block.data.quote?.substring(0, 50) || t('pagebuilder.blockPreview.noQuote')
    case 'video':
      return block.data.title || block.data.video_url || t('pagebuilder.blockPreview.addVideo').toLowerCase()
    case 'process':
      return `${block.data.steps?.length || 0} ${t('pagebuilder.blockPreview.addSteps').toLowerCase()}`
    case 'featured_products':
      return `${block.data.product_ids?.length || 0} ${t('pagebuilder.blockPreview.addProducts').toLowerCase()}`
    case 'timeline':
      return `${block.data.events?.length || 0} ${t('pagebuilder.blockPreview.addEvents').toLowerCase()}`
    case 'team':
      return `${block.data.members?.length || 0} ${t('pagebuilder.blockPreview.addMembers').toLowerCase()}`
    case 'categories':
      return `${block.data.category_ids?.length || 0} ${t('pagebuilder.blockPreview.addCategories').toLowerCase()}`
    case 'spacer':
      const heightLabels = {
        small: t('pagebuilder.blockForm.spacer.heightSmall'),
        medium: t('pagebuilder.blockForm.spacer.heightMedium'),
        large: t('pagebuilder.blockForm.spacer.heightLarge'),
        xlarge: t('pagebuilder.blockForm.spacer.heightXlarge')
      }
      return heightLabels[block.data.height as keyof typeof heightLabels] || t('pagebuilder.blockForm.spacer.heightMedium')
    default:
      return ''
  }
}
