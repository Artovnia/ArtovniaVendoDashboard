import { useState } from 'react'
import { Button, Container, Heading, Text, IconButton, DropdownMenu } from '@medusajs/ui'
import { Plus, Trash } from '@medusajs/icons'
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

const BLOCK_LABELS: Record<string, { label: string; emoji: string }> = {
  hero: { label: 'Baner główny', emoji: '🖼️' },
  rich_text: { label: 'Tekst', emoji: '📝' },
  image_gallery: { label: 'Galeria zdjęć', emoji: '🖼️' },
  image_text: { label: 'Zdjęcie z tekstem', emoji: '📷' },
  quote: { label: 'Cytat', emoji: '💬' },
  video: { label: 'Wideo', emoji: '🎬' },
  process: { label: 'Proces', emoji: '📋' },
  featured_products: { label: 'Polecane produkty', emoji: '🛍️' },
  timeline: { label: 'Oś czasu', emoji: '📅' },
  team: { label: 'Zespół', emoji: '👥' },
  categories: { label: 'Kategorie', emoji: '🏷️' },
  behind_scenes: { label: 'Za kulisami', emoji: '🎥' },
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
          <Heading level="h2">Bloki</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            Dodaj i edytuj bloki na swojej stronie
          </Text>
        </div>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" size="small">
              <Plus className="mr-1" />
              Dodaj blok
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {allowedBlocks.map((blockType) => {
              const blockInfo = BLOCK_LABELS[blockType]
              return (
                <DropdownMenu.Item
                  key={blockType}
                  onClick={() => onAddBlock(blockType)}
                >
                  <span className="mr-2">{blockInfo?.emoji || '📄'}</span>
                  {blockInfo?.label || blockType}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {blocks.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text className="text-ui-fg-subtle">
            Brak bloków. Kliknij "Dodaj blok" aby rozpocząć.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {blocks.map((block, index) => {
            const blockInfo = BLOCK_LABELS[block.type]
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
                      {blockInfo?.emoji || '📄'}
                    </div>
                    <div>
                      <Text className="font-medium">
                        {blockInfo?.label || block.type}
                      </Text>
                      <Text className="text-ui-fg-subtle text-xs">
                        {getBlockPreview(block)}
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

function getBlockPreview(block: Block): string {
  switch (block.type) {
    case 'hero':
      return block.data.title || 'Brak tytułu'
    case 'rich_text':
      return block.data.content?.substring(0, 50) || 'Brak treści'
    case 'image_gallery':
      return `${block.data.images?.length || 0} zdjęć`
    case 'image_text':
      return block.data.title || 'Brak tytułu'
    case 'quote':
      return block.data.quote?.substring(0, 50) || 'Brak cytatu'
    case 'video':
      return block.data.title || block.data.video_url || 'Brak wideo'
    case 'process':
      return `${block.data.steps?.length || 0} kroków`
    case 'featured_products':
      return `${block.data.product_ids?.length || 0} produktów`
    case 'timeline':
      return `${block.data.events?.length || 0} wydarzeń`
    case 'team':
      return `${block.data.members?.length || 0} osób`
    case 'categories':
      return `${block.data.category_ids?.length || 0} kategorii`
    case 'behind_scenes':
      return `${block.data.media?.length || 0} mediów`
    default:
      return ''
  }
}
