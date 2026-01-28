import { useState, useCallback, useRef } from 'react'
import { Button, Input, Label, Select, Textarea, Text, toast } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { Block } from '../../../../hooks/api/vendor-page.tsx'
import { FileUpload, FileType } from '../../../../components/common/file-upload/file-upload.tsx'
import { uploadFilesQuery } from '../../../../lib/client/client.ts'

const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// Focal Point Picker Modal
const FocalPointPicker = ({
  imageUrl,
  currentFocalPoint,
  onSave,
  onClose
}: {
  imageUrl: string
  currentFocalPoint?: { x: number; y: number }
  onSave: (focalPoint: { x: number; y: number }) => void
  onClose: () => void
}) => {
  const { t } = useTranslation()
  const [focalPoint, setFocalPoint] = useState(currentFocalPoint || { x: 50, y: 50 })
  const imageRef = useRef<HTMLImageElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setFocalPoint({
      x: Math.round(Math.max(0, Math.min(100, x))),
      y: Math.round(Math.max(0, Math.min(100, y)))
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-ui-bg-subtle rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium mb-4">{t('pagebuilder.blockForm.focalPoint.title')}</h3>
        <p className="text-sm text-ui-fg-subtle mb-4">
          {t('pagebuilder.blockForm.focalPoint.description')}
        </p>
        
        <div className="relative inline-block mb-4">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Focal point picker"
            className="max-w-full max-h-[400px] cursor-crosshair"
            onClick={handleImageClick}
          />
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`
            }}
          >
            <div className="w-full h-full rounded-full border-4 border-blue-500 bg-blue-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Label>X: {focalPoint.x}%</Label>
          </div>
          <div className="flex-1">
            <Label>Y: {focalPoint.y}%</Label>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('pagebuilder.blockForm.focalPoint.cancel')}
          </Button>
          <Button onClick={() => {
            onSave(focalPoint)
            onClose()
          }}>
            {t('pagebuilder.blockForm.focalPoint.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface BlockFormProps {
  block: Block
  onUpdate: (data: any) => void
}

export const BlockForm = ({ block, onUpdate }: BlockFormProps) => {
  const { t } = useTranslation()
  const handleChange = (key: string, value: any) => {
    onUpdate({ ...block.data, [key]: value })
  }

  // Handle multiple field updates at once (e.g., image_url + image_id)
  const handleMultiChange = (updates: Record<string, any>) => {
    onUpdate({ ...block.data, ...updates })
  }

  switch (block.type) {
    case 'hero':
      return <HeroBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'rich_text':
      return <RichTextBlockForm data={block.data} onChange={handleChange} />
    case 'image_gallery':
      return <ImageGalleryBlockForm data={block.data} onChange={handleChange} />
    case 'image_text':
      return <ImageTextBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'quote':
      return <QuoteBlockForm data={block.data} onChange={handleChange} />
    case 'video':
      return <VideoBlockForm data={block.data} onChange={handleChange} />
    case 'process':
      return <ProcessBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'featured_products':
      return <FeaturedProductsBlockForm data={block.data} onChange={handleChange} />
    case 'timeline':
      return <TimelineBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'team':
      return <TeamBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'categories':
      return <CategoriesBlockForm data={block.data} onChange={handleChange} />
    case 'behind_scenes':
      return <BehindScenesBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    case 'spacer':
      return <SpacerBlockForm data={block.data} onChange={handleChange} onMultiChange={handleMultiChange} />
    default:
      return <div>Unknown block type</div>
  }
}

interface FormProps {
  data: any
  onChange: (key: string, value: any) => void
  onMultiChange?: (updates: Record<string, any>) => void
}

// Reusable image upload component for blocks
const BlockImageUpload = ({
  label,
  currentUrl,
  onUpload
}: {
  label: string
  currentUrl?: string
  onUpload: (url: string, id: string) => void
}) => {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '')

  const handleUpload = useCallback(async (files: FileType[]) => {
    if (!files.length) return

    setIsUploading(true)
    setPreviewUrl(files[0].url) // Show preview immediately

    try {
      const result = await uploadFilesQuery(files)
      if (result.files && result.files.length > 0) {
        const uploaded = result.files[0]
        setPreviewUrl(uploaded.url)
        onUpload(uploaded.url, uploaded.id || uploaded.key)
        toast.success(t('pagebuilder.blockForm.imageUpload.success'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t('pagebuilder.blockForm.imageUpload.error'))
      setPreviewUrl(currentUrl || '')
    } finally {
      setIsUploading(false)
    }
  }, [currentUrl, onUpload])

  const handleDelete = () => {
    setPreviewUrl('')
    onUpload('', '')
    toast.success(t('pagebuilder.blockForm.imageUpload.deleted'))
  }

  return (
    <div>
      <Label>{label}</Label>
      {previewUrl ? (
        <div className="mt-2 space-y-2">
          <div className="relative w-full h-40 bg-ui-bg-subtle rounded overflow-hidden group">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title={t('pagebuilder.blockForm.imageUpload.delete')}
            >
              ×
            </button>
          </div>
          <Button type="button" variant="secondary" size="small" onClick={() => setPreviewUrl('')}>
            {t('pagebuilder.blockForm.imageUpload.change')}
          </Button>
        </div>
      ) : (
        <FileUpload
          label={t('pagebuilder.blockForm.imageUpload.dragOrClick')}
          onUploaded={handleUpload}
          formats={SUPPORTED_IMAGE_FORMATS}
          multiple={false}
        />
      )}
      {isUploading && <p className="text-sm text-ui-fg-muted mt-2">{t('pagebuilder.blockForm.imageUpload.uploading')}</p>}
    </div>
  )
}

// Multi-image upload for gallery
const BlockGalleryUpload = ({
  images,
  onImagesChange
}: {
  images: Array<{ id: string; url: string; alt?: string; caption?: string; order?: number; focal_point?: { x: number; y: number } }>
  onImagesChange: (images: Array<{ id: string; url: string; alt?: string; caption?: string; order?: number; focal_point?: { x: number; y: number } }>) => void
}) => {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [focalPointPickerImage, setFocalPointPickerImage] = useState<{ index: number; url: string; focalPoint?: { x: number; y: number } } | null>(null)

  const handleUpload = useCallback(async (files: FileType[]) => {
    if (!files.length) return

    setIsUploading(true)

    try {
      const result = await uploadFilesQuery(files)
      if (result.files && result.files.length > 0) {
        const newImages = result.files.map((f: any) => ({
          id: f.id || f.key,
          url: f.url,
          alt: '',
          caption: ''
        }))
        onImagesChange([...images, ...newImages])
        toast.success(t('pagebuilder.blockForm.galleryUpload.uploaded', { count: newImages.length }))
      }
    } catch (error) {
      toast.error(t('pagebuilder.blockForm.galleryUpload.error'))
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [images, onImagesChange])

  const handleRemove = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    // Update order for remaining images
    const reorderedImages = newImages.map((img, idx) => ({ ...img, order: idx }))
    onImagesChange(reorderedImages)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)
    
    // Update order for all images
    const reorderedImages = newImages.map((img, idx) => ({ ...img, order: idx }))
    onImagesChange(reorderedImages)
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSetFocalPoint = (index: number, focalPoint: { x: number; y: number }) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], focal_point: focalPoint }
    onImagesChange(newImages)
  }

  return (
    <div className="flex flex-col gap-4">
      <Label>{t('pagebuilder.blockForm.galleryUpload.title')}</Label>
      
      {/* Existing images */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-ui-fg-subtle mb-2">{t('pagebuilder.blockForm.galleryUpload.dragToReorder')}</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div 
                key={img.id || index} 
                className={`relative group cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-ui-border-interactive' : ''
                }`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="absolute top-1 left-1 bg-ui-bg-base text-ui-fg-base rounded px-1.5 py-0.5 text-xs font-medium z-10">
                  {index + 1}
                </div>
                <img 
                  src={img.url} 
                  alt={img.alt || `Image ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => setFocalPointPickerImage({ index, url: img.url, focalPoint: img.focal_point })}
                    className="flex-1 bg-blue-500 text-white rounded px-2 py-1 text-xs font-medium hover:bg-blue-600"
                    title={t('pagebuilder.blockForm.galleryUpload.setFocalPointTitle')}
                  >
                    {t('pagebuilder.blockForm.galleryUpload.setFocalPoint')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ×
                </button>
                {img.focal_point && (
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded px-1.5 py-0.5 text-xs z-10">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload new */}
      <FileUpload
        label={isUploading ? t('pagebuilder.blockForm.galleryUpload.uploading') : t('pagebuilder.blockForm.galleryUpload.addPhotos')}
        hint={t('pagebuilder.blockForm.galleryUpload.multipleHint')}
        multiple={true}
        formats={SUPPORTED_IMAGE_FORMATS}
        onUploaded={handleUpload}
      />
      
      {/* Focal Point Picker Modal */}
      {focalPointPickerImage && (
        <FocalPointPicker
          imageUrl={focalPointPickerImage.url}
          currentFocalPoint={focalPointPickerImage.focalPoint}
          onSave={(focalPoint) => handleSetFocalPoint(focalPointPickerImage.index, focalPoint)}
          onClose={() => setFocalPointPickerImage(null)}
        />
      )}
    </div>
  )
}

const HeroBlockForm = ({ data, onChange, onMultiChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <BlockImageUpload
      label={t('pagebuilder.blockForm.hero.backgroundImage')}
      currentUrl={data.image_url}
      onUpload={(url, id) => {
        onMultiChange?.({ image_url: url, image_id: id })
      }}
    />
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="rounded-edges-hero"
        checked={data.rounded_edges !== false}
        onChange={(e) => onChange('rounded_edges', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="rounded-edges-hero" className="cursor-pointer">{t('pagebuilder.blockForm.hero.roundedEdges')}</Label>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.hero.title')}</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder={t('pagebuilder.blockForm.hero.titlePlaceholder')}
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="title-italic-hero"
        checked={data.title_italic || false}
        onChange={(e) => onChange('title_italic', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="title-italic-hero" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
      <Select
        value={data.title_alignment || 'center'}
        onValueChange={(value) => onChange('title_alignment', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
          <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.hero.subtitle')}</Label>
      <Input
        value={data.subtitle || ''}
        onChange={(e) => onChange('subtitle', e.target.value)}
        placeholder={t('pagebuilder.blockForm.hero.subtitlePlaceholder')}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.hero.textPosition')}</Label>
      <Select
        value={data.text_position || 'center'}
        onValueChange={(value) => onChange('text_position', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.hero.left')}</Select.Item>
          <Select.Item value="center">{t('pagebuilder.blockForm.hero.center')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.hero.right')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.hero.overlayOpacity')}</Label>
      <Input
        type="number"
        min={0}
        max={100}
        value={data.overlay_opacity || 40}
        onChange={(e) => onChange('overlay_opacity', parseInt(e.target.value))}
      />
    </div>
  </div>
  )
}

const RichTextBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <div>
      <Label>{t('pagebuilder.blockForm.richText.heading')}</Label>
      <Input
        value={data.heading || ''}
        onChange={(e) => onChange('heading', e.target.value)}
        placeholder={t('pagebuilder.blockForm.richText.headingPlaceholder')}
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="heading-italic-richtext"
        checked={data.heading_italic || false}
        onChange={(e) => onChange('heading_italic', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="heading-italic-richtext" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
      <Select
        value={data.heading_alignment || 'left'}
        onValueChange={(value) => onChange('heading_alignment', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
          <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.richText.content')}</Label>
      <Textarea
        value={data.content || ''}
        onChange={(e) => onChange('content', e.target.value)}
        placeholder={t('pagebuilder.blockForm.richText.contentPlaceholder')}
        rows={6}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.richText.alignment')}</Label>
      <Select
        value={data.alignment || 'left'}
        onValueChange={(value) => onChange('alignment', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.hero.left')}</Select.Item>
          <Select.Item value="center">{t('pagebuilder.blockForm.hero.center')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.hero.right')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
  </div>
  )
}

const ImageGalleryBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <div>
      <Label>{t('pagebuilder.blockForm.imageGallery.layout')}</Label>
      <Select
        value={data.layout || 'grid'}
        onValueChange={(value) => onChange('layout', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="grid">{t('pagebuilder.blockForm.imageGallery.layoutGrid')}</Select.Item>
          <Select.Item value="masonry">{t('pagebuilder.blockForm.imageGallery.layoutMasonry')}</Select.Item>
          <Select.Item value="featured">{t('pagebuilder.blockForm.imageGallery.layoutFeatured')}</Select.Item>
          <Select.Item value="mosaic">{t('pagebuilder.blockForm.imageGallery.layoutMosaic')}</Select.Item>
          <Select.Item value="magazine">{t('pagebuilder.blockForm.imageGallery.layoutMagazine')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageGallery.columns')}</Label>
      <Select
        value={String(data.columns || 3)}
        onValueChange={(value) => onChange('columns', parseInt(value))}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="2">{t('pagebuilder.blockForm.imageGallery.columns2')}</Select.Item>
          <Select.Item value="3">{t('pagebuilder.blockForm.imageGallery.columns3')}</Select.Item>
          <Select.Item value="4">{t('pagebuilder.blockForm.imageGallery.columns4')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageGallery.gap')}</Label>
      <Select
        value={data.gap || 'medium'}
        onValueChange={(value) => onChange('gap', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="small">{t('pagebuilder.blockForm.imageGallery.gapSmall')}</Select.Item>
          <Select.Item value="medium">{t('pagebuilder.blockForm.imageGallery.gapMedium')}</Select.Item>
          <Select.Item value="large">{t('pagebuilder.blockForm.imageGallery.gapLarge')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="rounded-edges-gallery"
        checked={data.rounded_edges !== false}
        onChange={(e) => onChange('rounded_edges', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="rounded-edges-gallery" className="cursor-pointer">{t('pagebuilder.blockForm.imageGallery.roundedEdges')}</Label>
    </div>
    <BlockGalleryUpload
      images={data.images || []}
      onImagesChange={(images) => onChange('images', images)}
    />
  </div>
  )
}

const ImageTextBlockForm = ({ data, onChange, onMultiChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <BlockImageUpload
      label={t('pagebuilder.blockForm.imageText.image')}
      currentUrl={data.image_url}
      onUpload={(url) => onChange('image_url', url)}
    />
    <div>
      <Label>{t('pagebuilder.blockForm.imageText.title')}</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder={t('pagebuilder.blockForm.imageText.titlePlaceholder')}
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="title-italic-imagetext"
        checked={data.title_italic || false}
        onChange={(e) => onChange('title_italic', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="title-italic-imagetext" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
      <Select
        value={data.title_alignment || 'left'}
        onValueChange={(value) => onChange('title_alignment', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
          <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageText.imageRatio')}</Label>
      <Select
        value={data.image_ratio || '4:3'}
        onValueChange={(value) => onChange('image_ratio', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="1:1">{t('pagebuilder.blockForm.imageText.ratio1x1')}</Select.Item>
          <Select.Item value="4:3">{t('pagebuilder.blockForm.imageText.ratio4x3')}</Select.Item>
          <Select.Item value="16:9">{t('pagebuilder.blockForm.imageText.ratio16x9')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="rounded-edges-imagetext"
        checked={data.rounded_edges !== false}
        onChange={(e) => onChange('rounded_edges', e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="rounded-edges-imagetext" className="cursor-pointer">{t('pagebuilder.blockForm.imageText.roundedEdges')}</Label>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageText.imagePosition')}</Label>
      <Select
        value={data.image_position || 'left'}
        onValueChange={(value) => onChange('image_position', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">{t('pagebuilder.blockForm.imageText.left')}</Select.Item>
          <Select.Item value="right">{t('pagebuilder.blockForm.imageText.right')}</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageText.title')}</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder={t('pagebuilder.blockForm.imageText.titlePlaceholder')}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.imageText.content')}</Label>
      <Textarea
        value={data.content || ''}
        onChange={(e) => onChange('content', e.target.value)}
        placeholder={t('pagebuilder.blockForm.imageText.contentPlaceholder')}
        rows={4}
      />
    </div>
  </div>
  )
}

const QuoteBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <div>
      <Label>{t('pagebuilder.blockForm.quote.quote')}</Label>
      <Textarea
        value={data.quote || ''}
        onChange={(e) => onChange('quote', e.target.value)}
        placeholder={t('pagebuilder.blockForm.quote.quotePlaceholder')}
        rows={3}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.quote.author')}</Label>
      <Input
        value={data.author || ''}
        onChange={(e) => onChange('author', e.target.value)}
        placeholder={t('pagebuilder.blockForm.quote.authorPlaceholder')}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.quote.authorTitle')}</Label>
      <Input
        value={data.author_title || ''}
        onChange={(e) => onChange('author_title', e.target.value)}
        placeholder={t('pagebuilder.blockForm.quote.authorTitlePlaceholder')}
      />
    </div>
  </div>
  )
}

const VideoBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col gap-4">
    <div>
      <Label>{t('pagebuilder.blockForm.video.videoUrl')}</Label>
      <Input
        value={data.video_url || ''}
        onChange={(e) => onChange('video_url', e.target.value)}
        placeholder={t('pagebuilder.blockForm.video.videoUrlPlaceholder')}
      />
    </div>
    <div>
      <Label>{t('pagebuilder.blockForm.video.title')}</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder={t('pagebuilder.blockForm.video.titlePlaceholder')}
      />
    </div>
  </div>
  )
}

const ProcessBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const steps = data.steps || []

  const addStep = () => {
    onChange('steps', [...steps, { title: '', description: '', image_url: '', image_id: '' }])
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    onChange('steps', newSteps)
  }

  // Update multiple fields in a step at once (for image uploads)
  const updateStepMulti = (index: number, updates: Record<string, any>) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    onChange('steps', newSteps)
  }

  const removeStep = (index: number) => {
    const newSteps = [...steps]
    newSteps.splice(index, 1)
    onChange('steps', newSteps)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.process.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.process.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-process"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-process" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.process.layout')}</Label>
        <Select
          value={data.layout || 'numbered'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="numbered">{t('pagebuilder.blockForm.process.layoutNumbered')}</Select.Item>
            <Select.Item value="cards">{t('pagebuilder.blockForm.process.layoutCards')}</Select.Item>
            <Select.Item value="minimal">{t('pagebuilder.blockForm.process.layoutMinimal')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded-edges-process"
          checked={data.rounded_edges !== false}
          onChange={(e) => onChange('rounded_edges', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="rounded-edges-process" className="cursor-pointer">{t('pagebuilder.blockForm.process.roundedEdges')}</Label>
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>{t('pagebuilder.blockForm.process.steps')}</Label>
        {steps.map((step: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">{t('pagebuilder.blockForm.process.step', { number: index + 1 })}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeStep(index)}
              >
                {t('pagebuilder.blockForm.process.remove')}
              </Button>
            </div>
            <Input
              value={step.title || ''}
              onChange={(e) => updateStep(index, 'title', e.target.value)}
              placeholder={t('pagebuilder.blockForm.process.stepTitlePlaceholder')}
            />
            <Textarea
              value={step.description || ''}
              onChange={(e) => updateStep(index, 'description', e.target.value)}
              placeholder={t('pagebuilder.blockForm.process.stepDescriptionPlaceholder')}
              rows={2}
            />
            <BlockImageUpload
              label={t('pagebuilder.blockForm.process.stepImage')}
              currentUrl={step.image_url}
              onUpload={(url, id) => {
                updateStepMulti(index, { image_url: url, image_id: id })
              }}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addStep}>
          {t('pagebuilder.blockForm.process.addStep')}
        </Button>
      </div>
    </div>
  )
}

const FeaturedProductsBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const products = data.products || []
  
  const addProduct = () => {
    onChange('products', [...products, { title: '', image_url: '', url: '' }])
  }
  
  const removeProduct = (index: number) => {
    onChange('products', products.filter((_: any, i: number) => i !== index))
  }
  
  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products]
    updated[index] = { ...updated[index], [field]: value }
    onChange('products', updated)
  }
  
  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= products.length) return
    
    const updated = [...products]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange('products', updated)
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.featuredProducts.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.featuredProducts.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-featured"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-featured" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.featuredProducts.layout')}</Label>
        <Select
          value={data.layout || 'classic'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="classic">{t('pagebuilder.blockForm.featuredProducts.layoutClassic')}</Select.Item>
            <Select.Item value="minimal">{t('pagebuilder.blockForm.featuredProducts.layoutMinimal')}</Select.Item>
            <Select.Item value="editorial">{t('pagebuilder.blockForm.featuredProducts.layoutEditorial')}</Select.Item>
            <Select.Item value="overlay">{t('pagebuilder.blockForm.featuredProducts.layoutOverlay')}</Select.Item>
            <Select.Item value="polaroid">{t('pagebuilder.blockForm.featuredProducts.layoutPolaroid')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.featuredProducts.columns')}</Label>
        <Select
          value={String(data.columns || 3)}
          onValueChange={(value) => onChange('columns', parseInt(value))}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="2">{t('pagebuilder.blockForm.imageGallery.columns2')}</Select.Item>
            <Select.Item value="3">{t('pagebuilder.blockForm.imageGallery.columns3')}</Select.Item>
            <Select.Item value="4">{t('pagebuilder.blockForm.imageGallery.columns4')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded-edges-products"
          checked={data.rounded_edges !== false}
          onChange={(e) => onChange('rounded_edges', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="rounded-edges-products" className="cursor-pointer">{t('pagebuilder.blockForm.featuredProducts.roundedEdges')}</Label>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{t('pagebuilder.blockForm.featuredProducts.products')}</Label>
          <Text className="text-ui-fg-muted text-xs">
            {t('pagebuilder.blockForm.featuredProducts.addCardsHint')}
          </Text>
        </div>
        {products.map((product: any, index: number) => (
          <div key={index} className="p-4 border border-ui-border-base rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Text className="font-medium">{t('pagebuilder.blockForm.featuredProducts.product', { number: index + 1 })}</Text>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => moveProduct(index, 'up')}
                  disabled={index === 0}
                >
                  {t('pagebuilder.blockForm.featuredProducts.moveUp')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => moveProduct(index, 'down')}
                  disabled={index === products.length - 1}
                >
                  {t('pagebuilder.blockForm.featuredProducts.moveDown')}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={() => removeProduct(index)}
                >
                  {t('pagebuilder.blockForm.common.remove')}
                </Button>
              </div>
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.featuredProducts.productTitle')}</Label>
              <Input
                value={product.title || ''}
                onChange={(e) => updateProduct(index, 'title', e.target.value)}
                placeholder={t('pagebuilder.blockForm.featuredProducts.productTitlePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.featuredProducts.price')}</Label>
              <Input
                value={product.price || ''}
                onChange={(e) => updateProduct(index, 'price', e.target.value)}
                placeholder={t('pagebuilder.blockForm.featuredProducts.pricePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.featuredProducts.description')}</Label>
              <Textarea
                value={product.description || ''}
                onChange={(e) => updateProduct(index, 'description', e.target.value)}
                placeholder={t('pagebuilder.blockForm.featuredProducts.descriptionPlaceholder')}
                rows={2}
              />
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.featuredProducts.productLink')}</Label>
              <Input
                value={product.url || ''}
                onChange={(e) => updateProduct(index, 'url', e.target.value)}
                placeholder={t('pagebuilder.blockForm.featuredProducts.productLinkPlaceholder')}
              />
            </div>
            <BlockImageUpload
              label={t('pagebuilder.blockForm.featuredProducts.productImage')}
              currentUrl={product.image_url}
              onUpload={(url) => updateProduct(index, 'image_url', url)}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addProduct}>
          {t('pagebuilder.blockForm.featuredProducts.addProduct')}
        </Button>
      </div>
    </div>
  )
}

// Timeline Block Form
const TimelineBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const events = data.events || []

  const addEvent = () => {
    onChange('events', [...events, { year: '', title: '', description: '', image_url: '', image_id: '' }])
  }

  const updateEvent = (index: number, field: string, value: any) => {
    const newEvents = [...events]
    newEvents[index] = { ...newEvents[index], [field]: value }
    onChange('events', newEvents)
  }

  const updateEventMulti = (index: number, updates: Record<string, any>) => {
    const newEvents = [...events]
    newEvents[index] = { ...newEvents[index], ...updates }
    onChange('events', newEvents)
  }

  const removeEvent = (index: number) => {
    const newEvents = [...events]
    newEvents.splice(index, 1)
    onChange('events', newEvents)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.timeline.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.timeline.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-timeline"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-timeline" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.timeline.layout')}</Label>
        <Select
          value={data.layout || 'alternating'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="alternating">{t('pagebuilder.blockForm.timeline.layoutAlternating')}</Select.Item>
            <Select.Item value="vertical">{t('pagebuilder.blockForm.timeline.layoutVertical')}</Select.Item>
            <Select.Item value="horizontal">{t('pagebuilder.blockForm.timeline.layoutHorizontal')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.timeline.badgeStyle')}</Label>
        <Select
          value={data.badge_style || 'solid'}
          onValueChange={(value) => onChange('badge_style', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="solid">{t('pagebuilder.blockForm.timeline.badgeStyleSolid')}</Select.Item>
            <Select.Item value="outline">{t('pagebuilder.blockForm.timeline.badgeStyleOutline')}</Select.Item>
            <Select.Item value="minimal">{t('pagebuilder.blockForm.timeline.badgeStyleMinimal')}</Select.Item>
            <Select.Item value="pill">{t('pagebuilder.blockForm.timeline.badgeStylePill')}</Select.Item>
            <Select.Item value="rounded">{t('pagebuilder.blockForm.timeline.badgeStyleRounded')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded-edges-timeline"
          checked={data.rounded_edges !== false}
          onChange={(e) => onChange('rounded_edges', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="rounded-edges-timeline" className="cursor-pointer">{t('pagebuilder.blockForm.timeline.roundedEdges')}</Label>
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>{t('pagebuilder.blockForm.timeline.milestones')}</Label>
        {events.map((event: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">{t('pagebuilder.blockForm.timeline.event', { number: index + 1 })}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeEvent(index)}
              >
                {t('pagebuilder.blockForm.common.remove')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('pagebuilder.blockForm.timeline.yearDate')}</Label>
                <Input
                  value={event.year || ''}
                  onChange={(e) => updateEvent(index, 'year', e.target.value)}
                  placeholder={t('pagebuilder.blockForm.timeline.yearPlaceholder')}
                />
              </div>
              <div>
                <Label>{t('pagebuilder.blockForm.timeline.eventTitle')}</Label>
                <Input
                  value={event.title || ''}
                  onChange={(e) => updateEvent(index, 'title', e.target.value)}
                  placeholder={t('pagebuilder.blockForm.timeline.eventTitlePlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.timeline.eventDescription')}</Label>
              <Textarea
                value={event.description || ''}
                onChange={(e) => updateEvent(index, 'description', e.target.value)}
                placeholder={t('pagebuilder.blockForm.timeline.eventDescriptionPlaceholder')}
                rows={2}
              />
            </div>
            <BlockImageUpload
              label={t('pagebuilder.blockForm.timeline.photo')}
              currentUrl={event.image_url}
              onUpload={(url, id) => {
                updateEventMulti(index, { image_url: url, image_id: id })
              }}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addEvent}>
          {t('pagebuilder.blockForm.timeline.addEvent')}
        </Button>
      </div>
    </div>
  )
}

// Team/Artisan Block Form
const TeamBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const members = data.members || []

  const addMember = () => {
    onChange('members', [...members, { name: '', role: '', bio: '', image_url: '', image_id: '' }])
  }

  const updateMember = (index: number, field: string, value: any) => {
    const newMembers = [...members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    onChange('members', newMembers)
  }

  const updateMemberMulti = (index: number, updates: Record<string, any>) => {
    const newMembers = [...members]
    newMembers[index] = { ...newMembers[index], ...updates }
    onChange('members', newMembers)
  }

  const removeMember = (index: number) => {
    const newMembers = [...members]
    newMembers.splice(index, 1)
    onChange('members', newMembers)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.team.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.team.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-team"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-team" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.team.sectionDescription')}</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t('pagebuilder.blockForm.team.sectionDescriptionPlaceholder')}
          rows={2}
        />
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.team.layout')}</Label>
        <Select
          value={data.layout || 'circular'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="circular">{t('pagebuilder.blockForm.team.layoutCircular')}</Select.Item>
            <Select.Item value="cards">{t('pagebuilder.blockForm.team.layoutCards')}</Select.Item>
            <Select.Item value="minimal">{t('pagebuilder.blockForm.team.layoutMinimal')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded-edges-team"
          checked={data.rounded_edges !== false}
          onChange={(e) => onChange('rounded_edges', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="rounded-edges-team" className="cursor-pointer">{t('pagebuilder.blockForm.team.roundedEdges')}</Label>
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>{t('pagebuilder.blockForm.team.members')}</Label>
        {members.map((member: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">{t('pagebuilder.blockForm.team.person', { number: index + 1 })}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeMember(index)}
              >
                {t('pagebuilder.blockForm.common.remove')}
              </Button>
            </div>
            <BlockImageUpload
              label={t('pagebuilder.blockForm.team.photo')}
              currentUrl={member.image_url}
              onUpload={(url, id) => {
                updateMemberMulti(index, { image_url: url, image_id: id })
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('pagebuilder.blockForm.team.name')}</Label>
                <Input
                  value={member.name || ''}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                  placeholder={t('pagebuilder.blockForm.team.namePlaceholder')}
                />
              </div>
              <div>
                <Label>{t('pagebuilder.blockForm.team.role')}</Label>
                <Input
                  value={member.role || ''}
                  onChange={(e) => updateMember(index, 'role', e.target.value)}
                  placeholder={t('pagebuilder.blockForm.team.rolePlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.team.bio')}</Label>
              <Textarea
                value={member.bio || ''}
                onChange={(e) => updateMember(index, 'bio', e.target.value)}
                placeholder={t('pagebuilder.blockForm.team.bioPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addMember}>
          {t('pagebuilder.blockForm.team.addPerson')}
        </Button>
      </div>
    </div>
  )
}

// Categories Showcase Block Form
const CategoriesBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const categories = data.categories || []
  
  const addCategory = () => {
    onChange('categories', [...categories, { title: '', image_url: '', url: '' }])
  }
  
  const removeCategory = (index: number) => {
    onChange('categories', categories.filter((_: any, i: number) => i !== index))
  }
  
  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...categories]
    updated[index] = { ...updated[index], [field]: value }
    onChange('categories', updated)
  }
  
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return
    
    const updated = [...categories]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange('categories', updated)
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.categories.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.categories.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-categories"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-categories" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.categories.layout')}</Label>
        <Select
          value={data.layout || 'classic'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="classic">{t('pagebuilder.blockForm.categories.layoutClassic')}</Select.Item>
            <Select.Item value="minimal">{t('pagebuilder.blockForm.categories.layoutMinimal')}</Select.Item>
            <Select.Item value="bold">{t('pagebuilder.blockForm.categories.layoutBold')}</Select.Item>
            <Select.Item value="artistic">{t('pagebuilder.blockForm.categories.layoutArtistic')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.categories.columns')}</Label>
        <Select
          value={String(data.columns || 3)}
          onValueChange={(value) => onChange('columns', parseInt(value))}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="2">{t('pagebuilder.blockForm.imageGallery.columns2')}</Select.Item>
            <Select.Item value="3">{t('pagebuilder.blockForm.imageGallery.columns3')}</Select.Item>
            <Select.Item value="4">{t('pagebuilder.blockForm.imageGallery.columns4')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded-edges-categories"
          checked={data.rounded_edges !== false}
          onChange={(e) => onChange('rounded_edges', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="rounded-edges-categories" className="cursor-pointer">{t('pagebuilder.blockForm.categories.roundedEdges')}</Label>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{t('pagebuilder.blockForm.categories.categories')}</Label>
          <Text className="text-ui-fg-muted text-xs">
            {t('pagebuilder.blockForm.categories.addCardsHint')}
          </Text>
        </div>
        {categories.map((category: any, index: number) => (
          <div key={index} className="p-4 border border-ui-border-base rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Text className="font-medium">{t('pagebuilder.blockForm.categories.category', { number: index + 1 })}</Text>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => moveCategory(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => moveCategory(index, 'down')}
                  disabled={index === categories.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={() => removeCategory(index)}
                >
                  {t('pagebuilder.blockForm.common.remove')}
                </Button>
              </div>
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.categories.categoryName')}</Label>
              <Input
                value={category.title || ''}
                onChange={(e) => updateCategory(index, 'title', e.target.value)}
                placeholder={t('pagebuilder.blockForm.categories.categoryNamePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.categories.categoryDescription')}</Label>
              <Textarea
                value={category.description || ''}
                onChange={(e) => updateCategory(index, 'description', e.target.value)}
                placeholder={t('pagebuilder.blockForm.categories.categoryDescriptionPlaceholder')}
                rows={2}
              />
            </div>
            <div>
              <Label>{t('pagebuilder.blockForm.categories.categoryLink')}</Label>
              <Input
                value={category.url || ''}
                onChange={(e) => updateCategory(index, 'url', e.target.value)}
                placeholder={t('pagebuilder.blockForm.categories.categoryLinkPlaceholder')}
              />
            </div>
            <BlockImageUpload
              label={t('pagebuilder.blockForm.categories.categoryImage')}
              currentUrl={category.image_url}
              onUpload={(url) => updateCategory(index, 'image_url', url)}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addCategory}>
          {t('pagebuilder.blockForm.categories.addCategory')}
        </Button>
      </div>
    </div>
  )
}

// Behind the Scenes Block Form
const BehindScenesBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const media = data.media || []

  const handleUpload = useCallback(async (files: FileType[]) => {
    if (!files.length) return

    setIsUploading(true)

    try {
      const result = await uploadFilesQuery(files)
      if (result.files && result.files.length > 0) {
        const newMedia = result.files.map((f: any) => ({
          id: f.id || f.key,
          url: f.url,
          type: f.mime_type?.startsWith('video/') ? 'video' : 'image',
          caption: ''
        }))
        onChange('media', [...media, ...newMedia])
        toast.success(`Przesłano ${newMedia.length} plik(ów)`)
      }
    } catch (error) {
      toast.error('Nie udało się przesłać plików')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [media, onChange])

  const updateCaption = (index: number, caption: string) => {
    const newMedia = [...media]
    newMedia[index] = { ...newMedia[index], caption }
    onChange('media', newMedia)
  }

  const removeMedia = (index: number) => {
    const newMedia = [...media]
    newMedia.splice(index, 1)
    onChange('media', newMedia)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.behindScenes.sectionTitle')}</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('pagebuilder.blockForm.behindScenes.sectionTitlePlaceholder')}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="title-italic-behind"
          checked={data.title_italic || false}
          onChange={(e) => onChange('title_italic', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="title-italic-behind" className="cursor-pointer">{t('pagebuilder.blockForm.common.titleItalic')}</Label>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.common.titleAlignment')}</Label>
        <Select
          value={data.title_alignment || 'center'}
          onValueChange={(value) => onChange('title_alignment', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="left">{t('pagebuilder.blockForm.common.alignmentLeft')}</Select.Item>
            <Select.Item value="center">{t('pagebuilder.blockForm.common.alignmentCenter')}</Select.Item>
            <Select.Item value="right">{t('pagebuilder.blockForm.common.alignmentRight')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.behindScenes.sectionDescription')}</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t('pagebuilder.blockForm.behindScenes.sectionDescriptionPlaceholder')}
          rows={2}
        />
      </div>
      <div>
        <Label>{t('pagebuilder.blockForm.behindScenes.layout')}</Label>
        <Select
          value={data.layout || 'masonry'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="masonry">{t('pagebuilder.blockForm.behindScenes.layoutMasonry')}</Select.Item>
            <Select.Item value="grid">{t('pagebuilder.blockForm.behindScenes.layoutGrid')}</Select.Item>
            <Select.Item value="carousel">{t('pagebuilder.blockForm.behindScenes.layoutCarousel')}</Select.Item>
          </Select.Content>
        </Select>
      </div>

      {/* Existing media */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {media.map((item: any, index: number) => (
            <div key={item.id || index} className="relative group">
              {item.type === 'video' ? (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : (
                <img 
                  src={item.url} 
                  alt={item.caption || `Media ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <Input
                value={item.caption || ''}
                onChange={(e) => updateCaption(index, e.target.value)}
                placeholder={t('pagebuilder.blockForm.behindScenes.caption')}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload new */}
      <FileUpload
        label={isUploading ? t('pagebuilder.blockForm.behindScenes.uploading') : t('pagebuilder.blockForm.behindScenes.addMedia')}
        hint={t('pagebuilder.blockForm.behindScenes.mediaHint')}
        multiple={true}
        formats={[...SUPPORTED_IMAGE_FORMATS, 'video/mp4', 'video/webm']}
        onUploaded={handleUpload}
      />
    </div>
  )
}

// Spacer Block Form
const SpacerBlockForm = ({ data, onChange }: FormProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>{t('pagebuilder.blockForm.spacer.height')}</Label>
        <Select
          value={data.height || 'medium'}
          onValueChange={(value) => onChange('height', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="small">{t('pagebuilder.blockForm.spacer.heightSmall')}</Select.Item>
            <Select.Item value="medium">{t('pagebuilder.blockForm.spacer.heightMedium')}</Select.Item>
            <Select.Item value="large">{t('pagebuilder.blockForm.spacer.heightLarge')}</Select.Item>
            <Select.Item value="xlarge">{t('pagebuilder.blockForm.spacer.heightXlarge')}</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <p className="text-xs text-gray-500">{t('pagebuilder.blockForm.spacer.description', 'Add vertical spacing between blocks')}</p>
    </div>
  )
}
