import { useState, useCallback } from 'react'
import { Button, Container, Heading, Text, toast, Switch, Label, Select, Badge } from '@medusajs/ui'
import { Eye, EyeSlash } from '@medusajs/icons'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    'behind_scenes',
    'spacer'
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
      toast.success(t('pagebuilder.pageBuilder.changesSaved'))
    } catch (error) {
      toast.error(t('pagebuilder.pageBuilder.saveFailed'))
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
      toast.success(page.is_published ? t('pagebuilder.pageBuilder.pageHidden') : t('pagebuilder.pageBuilder.pagePublished'))
    } catch (error) {
      toast.error(t('pagebuilder.pageBuilder.publishFailed'))
      console.error('Error publishing page:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(t('pagebuilder.pageBuilder.deleteConfirm'))) {
      return
    }
    try {
      await deletePage()
      toast.success(t('pagebuilder.pageBuilder.pageDeleted'))
    } catch (error) {
      toast.error(t('pagebuilder.pageBuilder.deleteFailed'))
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
            <Heading level="h1">{t('pagebuilder.pageBuilder.title')}</Heading>
            <div className="flex items-center gap-2 mt-1">
              <Text className="text-ui-fg-subtle">
                {t('pagebuilder.pageBuilder.template')} {currentTemplate?.name_pl || page.template}
              </Text>
              <Badge color={page.is_published ? 'green' : 'grey'} size="small">
                {page.is_published ? t('pagebuilder.pageBuilder.published') : t('pagebuilder.pageBuilder.draft')}
              </Badge>
              {hasChanges && (
                <Badge color="orange" size="small">
                  {t('pagebuilder.pageBuilder.unsavedChanges')}
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
              {showPreview ? t('pagebuilder.pageBuilder.hidePreview') : t('pagebuilder.pageBuilder.showPreview')}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              {t('pagebuilder.pageBuilder.delete')}
            </Button>
            <Button
              variant={page.is_published ? 'secondary' : 'primary'}
              size="small"
              onClick={handlePublish}
              isLoading={isPublishing}
            >
              {page.is_published ? t('pagebuilder.pageBuilder.hidePage') : t('pagebuilder.pageBuilder.publish')}
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              isLoading={isUpdating}
              disabled={!hasChanges}
            >
              {t('pagebuilder.pageBuilder.save')}
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
              <Heading level="h2">{t('pagebuilder.settings.title')}</Heading>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('pagebuilder.settings.showStoryTab')}</Label>
                  <Text className="text-ui-fg-subtle text-sm">
                    {t('pagebuilder.settings.showStoryTabDescription')}
                  </Text>
                </div>
                <Switch
                  checked={settings.show_story_tab}
                  onCheckedChange={(checked) => handleSettingsChange('show_story_tab', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('pagebuilder.settings.animations')}</Label>
                  <Text className="text-ui-fg-subtle text-sm">
                    {t('pagebuilder.settings.animationsDescription')}
                  </Text>
                </div>
                <Select
                  value={settings.animations}
                  onValueChange={(value) => handleSettingsChange('animations', value)}
                >
                  <Select.Trigger className="w-[180px]">
                    <Select.Value placeholder={t('pagebuilder.settings.selectStyle')} />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">{t('pagebuilder.settings.animationNone')}</Select.Item>
                    <Select.Item value="subtle">{t('pagebuilder.settings.animationSubtle')}</Select.Item>
                    <Select.Item value="expressive">{t('pagebuilder.settings.animationExpressive')}</Select.Item>
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
                {t('pagebuilder.preview.livePreview')}
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
    case 'spacer':
      return {
        type: 'spacer',
        height: 'medium',
      }
    default:
      return { type }
  }
}
