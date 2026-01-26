import { useState, useCallback } from 'react'
import { Button, Container, Heading, Text, toast, Switch, Label, Select, Badge } from '@medusajs/ui'
import { Eye, EyeSlash } from '@medusajs/icons'
import { 
  useUpdateVendorPage, 
  usePublishVendorPage, 
  useDeleteVendorPage,
  VendorPage, 
  TemplateDefinition,
  Block 
} from '../../../hooks/api/vendor-page'
import { BlockEditor } from './block-editor'
import { LivePreview } from './live-preview'

// Simple UUID generator
const generateId = () => 'block_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

interface PageBuilderContentProps {
  page: VendorPage
  templates?: Record<string, TemplateDefinition>
}

export const PageBuilderContent = ({ page, templates }: PageBuilderContentProps) => {
  const { mutateAsync: updatePage, isPending: isUpdating } = useUpdateVendorPage()
  const { mutateAsync: publishPage, isPending: isPublishing } = usePublishVendorPage()
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeleteVendorPage()

  // Local state for editing
  const [blocks, setBlocks] = useState<Block[]>(page.blocks?.items || [])
  const [settings, setSettings] = useState(page.settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const currentTemplate = templates?.[page.template]

  // All available block types - templates only provide initial blocks, not restrictions
  const ALL_BLOCK_TYPES = [
    'hero',
    'rich_text',
    'image_gallery',
    'image_text',
    'quote',
    'video',
    'process',
    'featured_products',
    'timeline',
    'team',
    'categories',
    'behind_scenes'
  ]

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks)
    setHasChanges(true)
  }, [])

  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    try {
      await updatePage({
        blocks,
        settings,
      })
      setHasChanges(false)
      toast.success('Zmiany zostały zapisane')
    } catch (error) {
      toast.error('Nie udało się zapisać zmian')
      console.error('Error saving page:', error)
    }
  }

  const handlePublish = async () => {
    try {
      // Auto-save before publishing if there are unsaved changes
      if (hasChanges) {
        await updatePage({
          blocks,
          settings,
        })
        setHasChanges(false)
      }
      
      await publishPage(!page.is_published)
      toast.success(page.is_published ? 'Strona została ukryta' : 'Strona została opublikowana')
    } catch (error) {
      toast.error('Nie udało się zmienić statusu publikacji')
      console.error('Error publishing page:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć stronę? Ta operacja jest nieodwracalna.')) {
      return
    }
    try {
      await deletePage()
      toast.success('Strona została usunięta')
    } catch (error) {
      toast.error('Nie udało się usunąć strony')
      console.error('Error deleting page:', error)
    }
  }

  const handleAddBlock = (type: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      order: blocks.length,
      data: getDefaultBlockData(type),
      motion: {
        enter: 'fade-up',
        stagger: false,
      },
    }
    handleBlocksChange([...blocks, newBlock])
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Kreator strony</Heading>
            <div className="flex items-center gap-2 mt-1">
              <Text className="text-ui-fg-subtle">
                Szablon: {currentTemplate?.name_pl || page.template}
              </Text>
              <Badge color={page.is_published ? 'green' : 'grey'} size="small">
                {page.is_published ? 'Opublikowana' : 'Szkic'}
              </Badge>
              {hasChanges && (
                <Badge color="orange" size="small">
                  Niezapisane zmiany
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="transparent"
              size="small"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeSlash className="mr-1" /> : <Eye className="mr-1" />}
              {showPreview ? 'Ukryj podgląd' : 'Pokaż podgląd'}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Usuń
            </Button>
            <Button
              variant={page.is_published ? 'secondary' : 'primary'}
              size="small"
              onClick={handlePublish}
              isLoading={isPublishing}
            >
              {page.is_published ? 'Ukryj stronę' : '🚀 Opublikuj'}
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              isLoading={isUpdating}
              disabled={!hasChanges}
            >
              Zapisz
            </Button>
          </div>
        </div>
      </Container>

      {/* Main Content - Split Layout */}
      <div className={`grid gap-4 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Left Column - Editor */}
        <div className="flex flex-col gap-y-4">
          {/* Settings */}
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">Ustawienia</Heading>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pokaż zakładkę "Historia"</Label>
                  <Text className="text-ui-fg-subtle text-sm">
                    Wyświetl zakładkę z Twoją historią na stronie sprzedawcy
                  </Text>
                </div>
                <Switch
                  checked={settings.show_story_tab}
                  onCheckedChange={(checked) => handleSettingsChange('show_story_tab', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Animacje</Label>
                  <Text className="text-ui-fg-subtle text-sm">
                    Styl animacji elementów na stronie
                  </Text>
                </div>
                <Select
                  value={settings.animations}
                  onValueChange={(value) => handleSettingsChange('animations', value)}
                >
                  <Select.Trigger className="w-[180px]">
                    <Select.Value placeholder="Wybierz styl" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">Brak</Select.Item>
                    <Select.Item value="subtle">Subtelne</Select.Item>
                    <Select.Item value="expressive">Ekspresyjne</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>
          </Container>

          {/* Block Editor */}
          <BlockEditor
            blocks={blocks}
            allowedBlocks={ALL_BLOCK_TYPES}
            onBlocksChange={handleBlocksChange}
            onAddBlock={handleAddBlock}
            selectedBlockId={selectedBlockId}
            onBlockSelect={setSelectedBlockId}
          />
        </div>

        {/* Right Column - Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2">
              <Text className="text-sm font-medium text-ui-fg-subtle">
                📱 Podgląd na żywo
              </Text>
            </div>
            <LivePreview
              blocks={blocks}
              settings={settings}
              selectedBlockId={selectedBlockId}
              onBlockSelect={setSelectedBlockId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function getDefaultBlockData(type: string): any {
  switch (type) {
    case 'hero':
      return {
        type: 'hero',
        image_url: '',
        title: '',
        subtitle: '',
        overlay_opacity: 40,
        text_position: 'center',
      }
    case 'rich_text':
      return {
        type: 'rich_text',
        content: '',
        alignment: 'left',
      }
    case 'image_gallery':
      return {
        type: 'image_gallery',
        images: [],
        columns: 3,
        gap: 'medium',
      }
    case 'image_text':
      return {
        type: 'image_text',
        image_url: '',
        image_position: 'left',
        title: '',
        content: '',
        image_ratio: '1:1',
      }
    case 'quote':
      return {
        type: 'quote',
        quote: '',
        author: '',
        author_title: '',
      }
    case 'video':
      return {
        type: 'video',
        video_url: '',
        title: '',
        autoplay: false,
      }
    case 'process':
      return {
        type: 'process',
        title: '',
        steps: [],
      }
    case 'featured_products':
      return {
        type: 'featured_products',
        title: '',
        product_ids: [],
        columns: 3,
      }
    case 'timeline':
      return {
        type: 'timeline',
        title: '',
        events: [],
      }
    case 'team':
      return {
        type: 'team',
        title: '',
        description: '',
        members: [],
      }
    case 'categories':
      return {
        type: 'categories',
        title: '',
        category_ids: [],
        columns: 3,
      }
    case 'behind_scenes':
      return {
        type: 'behind_scenes',
        title: '',
        description: '',
        layout: 'masonry',
        media: [],
      }
    default:
      return { type }
  }
}
