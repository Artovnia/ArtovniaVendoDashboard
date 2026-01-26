import { useCallback, useState } from 'react'
import { Input, Textarea, Label, Select, Text, Button, toast } from '@medusajs/ui'
import { Block } from '../../../../hooks/api/vendor-page'
import { FileUpload, FileType } from '../../../../components/common/file-upload'
import { uploadFilesQuery } from '../../../../lib/client'

const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

interface BlockFormProps {
  block: Block
  onUpdate: (data: any) => void
}

export const BlockForm = ({ block, onUpdate }: BlockFormProps) => {
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
      return <BehindScenesBlockForm data={block.data} onChange={handleChange} />
    default:
      return <div>Nieznany typ bloku: {block.type}</div>
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
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '')

  const handleUpload = useCallback(async (files: FileType[]) => {
    if (!files.length) return

    setIsUploading(true)
    setPreviewUrl(files[0].url) // Show preview immediately

    try {
      const result = await uploadFilesQuery(files)
      if (result.files && result.files.length > 0) {
        const uploadedFile = result.files[0]
        onUpload(uploadedFile.url, uploadedFile.id || uploadedFile.key)
        setPreviewUrl(uploadedFile.url)
        toast.success('Obraz został przesłany')
      }
    } catch (error) {
      toast.error('Nie udało się przesłać obrazu')
      console.error('Upload error:', error)
      setPreviewUrl(currentUrl || '')
    } finally {
      setIsUploading(false)
    }
  }, [currentUrl, onUpload])

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">
        <FileUpload
          label={isUploading ? 'Przesyłanie...' : 'Przeciągnij lub kliknij aby dodać obraz'}
          hint="JPG, PNG, GIF, WebP"
          multiple={false}
          formats={SUPPORTED_IMAGE_FORMATS}
          onUploaded={handleUpload}
          uploadedImage={previewUrl}
        />
      </div>
    </div>
  )
}

// Multi-image upload for gallery
const BlockGalleryUpload = ({
  images,
  onImagesChange
}: {
  images: Array<{ id: string; url: string; alt?: string; caption?: string }>
  onImagesChange: (images: Array<{ id: string; url: string; alt?: string; caption?: string }>) => void
}) => {
  const [isUploading, setIsUploading] = useState(false)

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
        toast.success(`Przesłano ${newImages.length} obraz(ów)`)
      }
    } catch (error) {
      toast.error('Nie udało się przesłać obrazów')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [images, onImagesChange])

  const handleRemove = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onImagesChange(newImages)
  }

  return (
    <div className="flex flex-col gap-4">
      <Label>Zdjęcia galerii</Label>
      
      {/* Existing images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div key={img.id || index} className="relative group">
              <img 
                src={img.url} 
                alt={img.alt || `Image ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload new */}
      <FileUpload
        label={isUploading ? 'Przesyłanie...' : 'Dodaj zdjęcia do galerii'}
        hint="Możesz dodać wiele zdjęć naraz"
        multiple={true}
        formats={SUPPORTED_IMAGE_FORMATS}
        onUploaded={handleUpload}
      />
    </div>
  )
}

const HeroBlockForm = ({ data, onChange, onMultiChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <BlockImageUpload
      label="Obraz tła"
      currentUrl={data.image_url}
      onUpload={(url, id) => {
        onMultiChange?.({ image_url: url, image_id: id })
      }}
    />
    <div>
      <Label>Tytuł</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Tytuł banera"
      />
    </div>
    <div>
      <Label>Podtytuł</Label>
      <Input
        value={data.subtitle || ''}
        onChange={(e) => onChange('subtitle', e.target.value)}
        placeholder="Podtytuł banera"
      />
    </div>
    <div>
      <Label>Pozycja tekstu</Label>
      <Select
        value={data.text_position || 'center'}
        onValueChange={(value) => onChange('text_position', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">Lewo</Select.Item>
          <Select.Item value="center">Środek</Select.Item>
          <Select.Item value="right">Prawo</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>Przezroczystość nakładki (%)</Label>
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

const RichTextBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>Nagłówek (opcjonalnie)</Label>
      <Input
        value={data.heading || ''}
        onChange={(e) => onChange('heading', e.target.value)}
        placeholder="Nagłówek sekcji..."
      />
    </div>
    <div>
      <Label>Treść</Label>
      <Textarea
        value={data.content || ''}
        onChange={(e) => onChange('content', e.target.value)}
        placeholder="Wpisz treść..."
        rows={6}
      />
    </div>
    <div>
      <Label>Wyrównanie</Label>
      <Select
        value={data.alignment || 'left'}
        onValueChange={(value) => onChange('alignment', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">Lewo</Select.Item>
          <Select.Item value="center">Środek</Select.Item>
          <Select.Item value="right">Prawo</Select.Item>
        </Select.Content>
      </Select>
    </div>
  </div>
)

const ImageGalleryBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>Liczba kolumn</Label>
      <Select
        value={String(data.columns || 3)}
        onValueChange={(value) => onChange('columns', parseInt(value))}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="2">2 kolumny</Select.Item>
          <Select.Item value="3">3 kolumny</Select.Item>
          <Select.Item value="4">4 kolumny</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>Odstępy</Label>
      <Select
        value={data.gap || 'medium'}
        onValueChange={(value) => onChange('gap', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="small">Małe</Select.Item>
          <Select.Item value="medium">Średnie</Select.Item>
          <Select.Item value="large">Duże</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <BlockGalleryUpload
      images={data.images || []}
      onImagesChange={(images) => onChange('images', images)}
    />
  </div>
)

const ImageTextBlockForm = ({ data, onChange, onMultiChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <BlockImageUpload
      label="Obraz"
      currentUrl={data.image_url}
      onUpload={(url, id) => {
        onMultiChange?.({ image_url: url, image_id: id })
      }}
    />
    <div>
      <Label>Pozycja obrazu</Label>
      <Select
        value={data.image_position || 'left'}
        onValueChange={(value) => onChange('image_position', value)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="left">Lewo</Select.Item>
          <Select.Item value="right">Prawo</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>Tytuł</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Tytuł sekcji"
      />
    </div>
    <div>
      <Label>Treść</Label>
      <Textarea
        value={data.content || ''}
        onChange={(e) => onChange('content', e.target.value)}
        placeholder="Opis..."
        rows={4}
      />
    </div>
  </div>
)

const QuoteBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>Cytat</Label>
      <Textarea
        value={data.quote || ''}
        onChange={(e) => onChange('quote', e.target.value)}
        placeholder="Treść cytatu..."
        rows={3}
      />
    </div>
    <div>
      <Label>Autor</Label>
      <Input
        value={data.author || ''}
        onChange={(e) => onChange('author', e.target.value)}
        placeholder="Imię i nazwisko"
      />
    </div>
    <div>
      <Label>Tytuł autora</Label>
      <Input
        value={data.author_title || ''}
        onChange={(e) => onChange('author_title', e.target.value)}
        placeholder="np. Zadowolony klient"
      />
    </div>
  </div>
)

const VideoBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>URL wideo (YouTube/Vimeo)</Label>
      <Input
        value={data.video_url || ''}
        onChange={(e) => onChange('video_url', e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
      />
    </div>
    <div>
      <Label>Tytuł</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Tytuł wideo"
      />
    </div>
  </div>
)

const ProcessBlockForm = ({ data, onChange }: FormProps) => {
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
        <Label>Tytuł sekcji</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Mój proces twórczy"
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>Kroki procesu</Label>
        {steps.map((step: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">Krok {index + 1}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeStep(index)}
              >
                Usuń
              </Button>
            </div>
            <Input
              value={step.title || ''}
              onChange={(e) => updateStep(index, 'title', e.target.value)}
              placeholder="Tytuł kroku"
            />
            <Textarea
              value={step.description || ''}
              onChange={(e) => updateStep(index, 'description', e.target.value)}
              placeholder="Opis kroku"
              rows={2}
            />
            <BlockImageUpload
              label="Obraz kroku (opcjonalnie)"
              currentUrl={step.image_url}
              onUpload={(url, id) => {
                updateStepMulti(index, { image_url: url, image_id: id })
              }}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addStep}>
          + Dodaj krok
        </Button>
      </div>
    </div>
  )
}

const FeaturedProductsBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>Tytuł sekcji</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Polecane produkty"
      />
    </div>
    <div>
      <Label>Liczba kolumn</Label>
      <Select
        value={String(data.columns || 3)}
        onValueChange={(value) => onChange('columns', parseInt(value))}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="2">2 kolumny</Select.Item>
          <Select.Item value="3">3 kolumny</Select.Item>
          <Select.Item value="4">4 kolumny</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>Linki do produktów (po jednym w linii)</Label>
      <Text className="text-ui-fg-subtle text-sm mb-2">
        Wklej linki do produktów ze sklepu, np. /products/nazwa-produktu
      </Text>
      <Textarea
        value={(data.product_handles || []).join('\n')}
        onChange={(e) => {
          const handles = e.target.value.split('\n').filter(Boolean).map(url => {
            // Extract handle from URL like /products/handle or full URL
            const match = url.match(/\/products\/([^/?#]+)/)
            return match ? match[1] : url.trim()
          })
          onChange('product_handles', handles)
        }}
        placeholder="/products/recznie-robiona-ceramika&#10;/products/drewniana-miska"
        rows={4}
      />
    </div>
  </div>
)

// Timeline Block Form
const TimelineBlockForm = ({ data, onChange }: FormProps) => {
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
        <Label>Tytuł sekcji</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Nasza historia"
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>Kamienie milowe</Label>
        {events.map((event: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">Wydarzenie {index + 1}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeEvent(index)}
              >
                Usuń
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rok/Data</Label>
                <Input
                  value={event.year || ''}
                  onChange={(e) => updateEvent(index, 'year', e.target.value)}
                  placeholder="2020"
                />
              </div>
              <div>
                <Label>Tytuł</Label>
                <Input
                  value={event.title || ''}
                  onChange={(e) => updateEvent(index, 'title', e.target.value)}
                  placeholder="Założenie firmy"
                />
              </div>
            </div>
            <div>
              <Label>Opis</Label>
              <Textarea
                value={event.description || ''}
                onChange={(e) => updateEvent(index, 'description', e.target.value)}
                placeholder="Krótki opis wydarzenia..."
                rows={2}
              />
            </div>
            <BlockImageUpload
              label="Zdjęcie (opcjonalnie)"
              currentUrl={event.image_url}
              onUpload={(url, id) => {
                updateEventMulti(index, { image_url: url, image_id: id })
              }}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addEvent}>
          + Dodaj wydarzenie
        </Button>
      </div>
    </div>
  )
}

// Team/Artisan Block Form
const TeamBlockForm = ({ data, onChange }: FormProps) => {
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
        <Label>Tytuł sekcji</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Poznaj nasz zespół"
        />
      </div>
      <div>
        <Label>Opis sekcji</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Krótki opis zespołu..."
          rows={2}
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <Label>Członkowie zespołu</Label>
        {members.map((member: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text className="font-medium">Osoba {index + 1}</Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => removeMember(index)}
              >
                Usuń
              </Button>
            </div>
            <BlockImageUpload
              label="Zdjęcie"
              currentUrl={member.image_url}
              onUpload={(url, id) => {
                updateMemberMulti(index, { image_url: url, image_id: id })
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Imię i nazwisko</Label>
                <Input
                  value={member.name || ''}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>
              <div>
                <Label>Rola/Stanowisko</Label>
                <Input
                  value={member.role || ''}
                  onChange={(e) => updateMember(index, 'role', e.target.value)}
                  placeholder="Założyciel"
                />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={member.bio || ''}
                onChange={(e) => updateMember(index, 'bio', e.target.value)}
                placeholder="Krótki opis osoby..."
                rows={2}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addMember}>
          + Dodaj osobę
        </Button>
      </div>
    </div>
  )
}

// Categories Showcase Block Form
const CategoriesBlockForm = ({ data, onChange }: FormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <Label>Tytuł sekcji</Label>
      <Input
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Nasze kategorie"
      />
    </div>
    <div>
      <Label>Liczba kolumn</Label>
      <Select
        value={String(data.columns || 3)}
        onValueChange={(value) => onChange('columns', parseInt(value))}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="2">2 kolumny</Select.Item>
          <Select.Item value="3">3 kolumny</Select.Item>
          <Select.Item value="4">4 kolumny</Select.Item>
        </Select.Content>
      </Select>
    </div>
    <div>
      <Label>Linki do kategorii (po jednym w linii)</Label>
      <Text className="text-ui-fg-subtle text-sm mb-2">
        Wklej linki do kategorii ze sklepu, np. /categories/ceramika
      </Text>
      <Textarea
        value={(data.category_handles || []).join('\n')}
        onChange={(e) => {
          const handles = e.target.value.split('\n').filter(Boolean).map(url => {
            // Extract handle from URL like /categories/handle or full URL
            const match = url.match(/\/categories\/([^/?#]+)/)
            return match ? match[1] : url.trim()
          })
          onChange('category_handles', handles)
        }}
        placeholder="/categories/ceramika&#10;/categories/drewno"
        rows={4}
      />
    </div>
  </div>
)

// Behind the Scenes Block Form
const BehindScenesBlockForm = ({ data, onChange }: FormProps) => {
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
        <Label>Tytuł sekcji</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Za kulisami"
        />
      </div>
      <div>
        <Label>Opis sekcji</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Zobacz jak powstają nasze produkty..."
          rows={2}
        />
      </div>
      <div>
        <Label>Układ</Label>
        <Select
          value={data.layout || 'masonry'}
          onValueChange={(value) => onChange('layout', value)}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="masonry">Masonry (Pinterest)</Select.Item>
            <Select.Item value="grid">Siatka</Select.Item>
            <Select.Item value="carousel">Karuzela</Select.Item>
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
                placeholder="Podpis..."
                className="mt-1"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload new */}
      <FileUpload
        label={isUploading ? 'Przesyłanie...' : 'Dodaj zdjęcia lub filmy'}
        hint="Zdjęcia i filmy z warsztatu, procesu tworzenia"
        multiple={true}
        formats={[...SUPPORTED_IMAGE_FORMATS, 'video/mp4', 'video/webm']}
        onUploaded={handleUpload}
      />
    </div>
  )
}
