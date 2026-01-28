import { useTranslation } from 'react-i18next'
import { Block } from '../../../hooks/api/vendor-page'

interface BlockPreviewProps {
  block: Block
}

export const BlockPreview = ({ block }: BlockPreviewProps) => {
  const { t } = useTranslation()
  
  switch (block.type) {
    case 'hero':
      return <HeroPreview data={block.data} />
    case 'rich_text':
      return <RichTextPreview data={block.data} />
    case 'image_gallery':
      return <ImageGalleryPreview data={block.data} />
    case 'image_text':
      return <ImageTextPreview data={block.data} />
    case 'quote':
      return <QuotePreview data={block.data} />
    case 'video':
      return <VideoPreview data={block.data} />
    case 'process':
      return <ProcessPreview data={block.data} />
    case 'featured_products':
      return <FeaturedProductsPreview data={block.data} />
    case 'timeline':
      return <TimelinePreview data={block.data} />
    case 'team':
      return <TeamPreview data={block.data} />
    case 'categories':
      return <CategoriesPreview data={block.data} />
    case 'behind_scenes':
      return <BehindScenesPreview data={block.data} />
    case 'spacer':
      return <SpacerPreview data={block.data} />
    default:
      return (
        <div className="p-4 bg-[#F4F0EB] rounded text-center text-[#3B3634]/50">
          {t('pagebuilder.blockPreview.unknownBlock', { type: block.type })}
        </div>
      )
  }
}

const HeroPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const hasImage = data.image_url && data.image_url.length > 0
  const roundedEdges = data.rounded_edges !== false
  
  const positionClasses = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end'
  }
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  const titleClasses = `text-xl md:text-2xl font-instrument-serif text-white mb-2 ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  const subtitleClasses = `text-sm text-white/90 max-w-md ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]}`
  
  return (
    <div className={`relative w-full h-48 md:h-64 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 ${roundedEdges ? 'rounded-lg' : ''}`}>
      {hasImage ? (
        <img
          src={data.image_url}
          alt={data.title || 'Hero'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/30">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: (data.overlay_opacity || 40) / 100 }}
      />
      <div className={`relative z-10 h-full flex flex-col justify-center px-6 ${positionClasses[data.text_position as keyof typeof positionClasses] || positionClasses.center}`}>
        {data.title ? (
          <h2 className={titleClasses}>
            {data.title}
          </h2>
        ) : (
          <span className="text-white/50 text-lg">{t('pagebuilder.blockPreview.bannerTitle')}</span>
        )}
        {data.subtitle ? (
          <p className={subtitleClasses}>
            {data.subtitle}
          </p>
        ) : (
          <span className="text-white/30 text-sm">{t('pagebuilder.blockPreview.subtitle')}</span>
        )}
      </div>
    </div>
  )
}

const RichTextPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const headingAlignment = data.heading_alignment || 'left'
  const headingItalic = data.heading_italic || false
  const headingClasses = `text-xl font-instrument-serif text-[#3B3634] ${alignmentClasses[headingAlignment as keyof typeof alignmentClasses]} ${headingItalic ? 'italic' : ''}`
  
  return (
    <div className={`p-4 bg-[#F4F0EB] rounded-lg space-y-3 ${alignmentClasses[data.alignment as keyof typeof alignmentClasses] || 'text-left'}`}>
      {data.heading && (
        <h3 className={headingClasses}>{data.heading}</h3>
      )}
      {data.content ? (
        <div 
          className="prose prose-sm max-w-none text-[#3B3634]"
          dangerouslySetInnerHTML={{ __html: data.content.replace(/\n/g, '<br/>') }}
        />
      ) : !data.heading ? (
        <p className="text-[#3B3634]/50 italic">{t('pagebuilder.blockPreview.textContent')}</p>
      ) : null}
    </div>
  )
}

const ImageGalleryPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const rawImages = data.images || []
  // Sort images by order field
  const images = [...rawImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const columns = data.columns || 3
  const layout = data.layout || 'grid'
  const gap = data.gap || 'medium'
  const roundedEdges = data.rounded_edges !== false
  const gapClasses = {
    small: 'gap-1',
    medium: 'gap-2',
    large: 'gap-3'
  }
  
  // Helper function to get focal point style
  const getFocalPointStyle = (focalPoint?: { x: number; y: number }) => {
    if (!focalPoint) return {}
    return {
      objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
    }
  }
  
  if (images.length === 0) {
    return (
      <div className="p-8 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addPhotos')}</p>
      </div>
    )
  }
  
  // Grid Layout
  if (layout === 'grid') {
    return (
      <div className={`grid grid-cols-${columns} ${gapClasses[gap as keyof typeof gapClasses]}`}>
        {images.map((image: any, index: number) => (
          <div key={index} className={`aspect-square overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
            <img src={image.url} alt={image.alt || t('pagebuilder.blockPreview.photo', { number: index + 1 })} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
          </div>
        ))}
      </div>
    )
  }
  
  // Masonry Layout
  if (layout === 'masonry') {
    const columnCount = columns
    const imageColumns: any[][] = Array.from({ length: columnCount }, () => [])
    images.forEach((image: any, index: number) => {
      imageColumns[index % columnCount].push(image)
    })
    
    return (
      <div className={`flex ${gapClasses[gap as keyof typeof gapClasses]}`}>
        {imageColumns.map((columnImages, colIndex) => (
          <div key={colIndex} className={`flex-1 flex flex-col ${gapClasses[gap as keyof typeof gapClasses]}`}>
            {columnImages.map((image, imgIndex) => {
              const aspectRatios = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[2/3]']
              const aspectRatio = aspectRatios[(colIndex + imgIndex) % aspectRatios.length]
              return (
                <div key={imgIndex} className={`${aspectRatio} overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
                  <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
  
  // Featured Layout
  if (layout === 'featured') {
    const [featuredImage, ...restImages] = images
    return (
      <div className={`flex flex-col ${gapClasses[gap as keyof typeof gapClasses]}`}>
        <div className={`aspect-[16/9] overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
          <img src={featuredImage.url} alt={featuredImage.alt} className="w-full h-full object-cover" style={getFocalPointStyle(featuredImage.focal_point)} />
        </div>
        {restImages.length > 0 && (
          <div className={`grid grid-cols-4 ${gapClasses[gap as keyof typeof gapClasses]}`}>
            {restImages.slice(0, 4).map((image: any, index: number) => (
              <div key={index} className={`aspect-square overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
                <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // Mosaic Layout - Match storefront with responsive columns
  if (layout === 'mosaic') {
    const getSizeClass = (index: number) => {
      const pattern = index % 6
      switch (pattern) {
        case 0: return 'col-span-2 row-span-2' // Large
        case 1: return 'col-span-1 row-span-1' // Small
        case 2: return 'col-span-1 row-span-1' // Small
        case 3: return 'col-span-2 row-span-1' // Wide
        case 4: return 'col-span-1 row-span-2' // Tall
        case 5: return 'col-span-1 row-span-1' // Small
        default: return 'col-span-1 row-span-1'
      }
    }
    
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[100px] ${gapClasses[gap as keyof typeof gapClasses]}`}>
        {images.map((image: any, index: number) => (
          <div key={index} className={`relative overflow-hidden bg-[#F4F0EB] ${getSizeClass(index)} ${roundedEdges ? 'rounded-lg' : ''}`}>
            <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
          </div>
        ))}
      </div>
    )
  }
  
  // Magazine Layout - Match storefront with dynamic spacing
  if (layout === 'magazine') {
    const spacingClass = gap === 'small' ? 'space-y-2' : gap === 'large' ? 'space-y-4' : 'space-y-3'
    return (
      <div className={spacingClass}>
        {images.map((image: any, index: number) => {
          const isLarge = index % 3 === 0
          return (
            <div key={index} className={`relative overflow-hidden border border-[#3B3634] p-0.5 ${isLarge ? 'aspect-[21/9]' : 'aspect-[16/9]'} bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
              <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
            </div>
          )
        })}
      </div>
    )
  }
  
  // Default fallback
  return (
    <div className={`grid grid-cols-${columns} ${gapClasses[gap as keyof typeof gapClasses]}`}>
      {images.map((image: any, index: number) => (
        <div key={index} className="aspect-square overflow-hidden rounded bg-[#F4F0EB]">
          <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={getFocalPointStyle(image.focal_point)} />
        </div>
      ))}
    </div>
  )
}

const ImageTextPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const hasImage = data.image_url && data.image_url.length > 0
  const isLeft = data.image_position === 'left'
  const roundedEdges = data.rounded_edges !== false
  const imageRatio = data.image_ratio || '4:3'
  
  const ratioClasses = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video'
  }
  
  const imageElement = (
    <div className={`${ratioClasses[imageRatio as keyof typeof ratioClasses]} bg-[#F4F0EB] flex items-center justify-center overflow-hidden ${roundedEdges ? 'rounded-lg' : ''}`}>
      {hasImage ? (
        <img src={data.image_url} alt={data.title || ''} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-12 h-12 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
    </div>
  )
  
  const textElement = (
    <div className="flex flex-col justify-center p-4">
      {data.title ? (
        <h3 className="text-lg font-instrument-serif mb-2 text-[#3B3634]">{data.title}</h3>
      ) : (
        <span className="text-[#3B3634]/50 italic mb-2">{t('pagebuilder.blockPreview.sectionTitle')}</span>
      )}
      {data.content ? (
        <p className="text-sm text-[#3B3634]/80">{data.content}</p>
      ) : (
        <span className="text-[#3B3634]/40 text-sm italic">{t('pagebuilder.blockPreview.descriptionContent')}</span>
      )}
    </div>
  )
  
  return (
    <div className="grid grid-cols-2 gap-4 bg-[#F4F0EB]  overflow-hidden">
      {isLeft ? (
        <>
          {imageElement}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {imageElement}
        </>
      )}
    </div>
  )
}

const QuotePreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  return (
    <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
      <svg className="w-8 h-8 mx-auto text-[#3B3634]/40 mb-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      {data.quote ? (
        <blockquote className="text-lg italic mb-3 text-[#3B3634]">"{data.quote}"</blockquote>
      ) : (
        <p className="text-[#3B3634]/50 italic mb-3">{t('pagebuilder.blockPreview.enterQuote')}</p>
      )}
      {(data.author || data.author_title) && (
        <div className="text-sm text-[#3B3634]/70">
          {data.author && <span className="font-medium">{data.author}</span>}
          {data.author_title && <span className="ml-1">— {data.author_title}</span>}
        </div>
      )}
    </div>
  )
}

const VideoPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const hasVideo = data.video_url && data.video_url.length > 0
  
  return (
    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
      {hasVideo ? (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {data.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
              <p className="text-white font-medium">{data.title}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-white/50">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{t('pagebuilder.blockPreview.addVideo')}</p>
        </div>
      )}
    </div>
  )
}

const ProcessPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const steps = data.steps || []
  const layout = data.layout || 'numbered'
  const roundedEdges = data.rounded_edges !== false
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  if (steps.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addSteps')}</p>
      </div>
    )
  }
  
  // Numbered Layout
  if (layout === 'numbered') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.slice(0, 6).map((step: any, index: number) => (
            <div key={index} className="flex flex-col h-full">
              <div className="flex items-start gap-2 flex-1">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-[#3B3634] flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-instrument-serif text-sm mb-1 text-[#3B3634]">{step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}</h4>
                  <p className="text-xs text-[#3B3634]/70 line-clamp-2">{step.description || t('pagebuilder.blockPreview.stepDescription')}</p>
                </div>
              </div>
              {step.image_url && (
                <div className={`mt-2 aspect-video overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
                  <img 
                    src={step.image_url} 
                    alt={step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Cards Layout
  if (layout === 'cards') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.slice(0, 6).map((step: any, index: number) => (
            <div key={index} className={`bg-[#F4F0EB] p-3 flex flex-col h-full ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B3634] text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h4 className="font-instrument-serif text-[#3B3634] text-sm">{step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}</h4>
              </div>
              <p className="text-xs text-[#3B3634]/70 mb-2 flex-1 line-clamp-2">{step.description || t('pagebuilder.blockPreview.stepDescription')}</p>
              {step.image_url && (
                <div className={`aspect-video overflow-hidden bg-white ${roundedEdges ? 'rounded-lg' : ''}`}>
                  <img 
                    src={step.image_url} 
                    alt={step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Minimal Layout
  if (layout === 'minimal') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="max-w-2xl mx-auto space-y-4">
          {steps.slice(0, 4).map((step: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#3B3634] text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-instrument-serif text-sm mb-1 text-[#3B3634]">{step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}</h4>
                <p className="text-xs text-[#3B3634]/70 mb-2 line-clamp-2">{step.description || t('pagebuilder.blockPreview.stepDescription')}</p>
                {step.image_url && (
                  <div className={`aspect-video overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
                    <img 
                      src={step.image_url} 
                      alt={step.title || t('pagebuilder.blockPreview.step', { number: index + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

const FeaturedProductsPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const products = data.products || []
  const columns = data.columns || 3
  const layout = data.layout || 'classic'
  const roundedEdges = data.rounded_edges !== false
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  if (products.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addProducts')}</p>
      </div>
    )
  }
  
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }
  
  // Classic Layout
  if (layout === 'classic') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
          {products.slice(0, 6).map((product: any, index: number) => (
            <div key={index} className={`bg-[#F4F0EB] overflow-hidden border border-[#3B3634]/10 ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="aspect-square bg-[#F4F0EB] relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2 bg-primary">
                <div className="text-xs text-[#3B3634] font-medium truncate">{product.title || t('pagebuilder.blockPreview.product')}</div>
                {product.price && <div className="text-xs text-[#8B7355] mt-0.5">{product.price}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Minimal Layout
  if (layout === 'minimal') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-3`}>
          {products.slice(0, 6).map((product: any, index: number) => (
            <div key={index}>
              <div className={`aspect-[3/4] bg-[#F4F0EB] overflow-hidden mb-2 ${roundedEdges ? 'rounded-lg' : ''}`}>
                {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />}
              </div>
              <h4 className="text-xs font-medium text-[#3B3634] truncate">{product.title || t('pagebuilder.blockPreview.product')}</h4>
              {product.price && <p className="text-xs text-[#8B7355] mt-0.5">{product.price}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Editorial Layout
  if (layout === 'editorial') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
          {products.slice(0, 6).map((product: any, index: number) => (
            <div key={index} className={`border border-[#3B3634] p-1 ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="aspect-[4/5] bg-[#F4F0EB] relative overflow-hidden">
                {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />}
                <div className="absolute bottom-0 left-0 right-0 bg-tertiary text-tertiary p-2">
                  <p className="text-xs font-medium truncate">{product.title || t('pagebuilder.blockPreview.product')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Overlay Layout
  if (layout === 'overlay') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
          {products.slice(0, 6).map((product: any, index: number) => (
            <div key={index} className={`relative aspect-square overflow-hidden ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="absolute inset-0 bg-[#F4F0EB]">
                {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-2 w-full">
                  <p className="text-xs text-white font-medium truncate">{product.title || t('pagebuilder.blockPreview.product')}</p>
                  {product.price && <p className="text-xs text-white/90">{product.price}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Polaroid Layout
  if (layout === 'polaroid') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-3`}>
          {products.slice(0, 6).map((product: any, index: number) => (
            <div key={index} className={`bg-white p-2 shadow-md ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="aspect-square bg-[#F4F0EB] overflow-hidden mb-2">
                {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />}
              </div>
              <p className="text-xs text-center text-[#3B3634] font-medium truncate">{product.title || t('pagebuilder.blockPreview.product')}</p>
              {product.price && <p className="text-xs text-center text-[#8B7355] mt-0.5">{product.price}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Default fallback
  return (
    <div className="space-y-3">
      {data.title && <h3 className={titleClasses}>{data.title}</h3>}
      <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
        {products.slice(0, 6).map((product: any, index: number) => (
          <div key={index} className={`bg-[#F4F0EB] overflow-hidden ${roundedEdges ? 'rounded-lg' : ''}`}>
            <div className="aspect-square">
              {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-2">
              <p className="text-xs truncate">{product.title || t('pagebuilder.blockPreview.product')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Timeline Preview
const TimelinePreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const events = data.events || []
  const layout = data.layout || 'alternating'
  const badgeStyle = data.badge_style || 'solid'
  const roundedEdges = data.rounded_edges !== false
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  if (events.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addEvents')}</p>
      </div>
    )
  }
  
  // Badge style classes
  const getBadgeClasses = () => {
    const baseClasses = 'inline-block text-xs font-bold px-2 py-0.5 mb-1.5'
    const roundingClasses = roundedEdges ? 'rounded' : ''
    
    switch (badgeStyle) {
      case 'solid':
        return `${baseClasses} bg-[#3B3634] text-white ${roundingClasses}`
      case 'outline':
        return `${baseClasses} border-2 border-[#3B3634] text-[#3B3634] bg-transparent ${roundingClasses}`
      case 'minimal':
        return `${baseClasses} text-[#3B3634] bg-[#3B3634]/10 ${roundingClasses}`
      case 'pill':
        return `${baseClasses} bg-[#3B3634] text-white rounded-full`
      case 'rounded':
        return `${baseClasses} bg-[#3B3634] text-white rounded-lg`
      default:
        return `${baseClasses} bg-[#3B3634] text-white ${roundingClasses}`
    }
  }
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  // Alternating Layout
  if (layout === 'alternating') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#3B3634]/20 transform -translate-x-1/2" />
          <div className="space-y-4">
            {events.slice(0, 3).map((event: any, index: number) => (
              <div key={index} className={`relative flex gap-3 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="absolute left-1/2 top-3 w-2.5 h-2.5 rounded-full bg-[#3B3634] border-2 border-white transform -translate-x-1/2 z-10" />
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-4 text-right' : 'pl-4'}`}>
                  <div className={`bg-[#F4F0EB] p-2.5 ${roundedEdges ? 'rounded-lg' : ''}`}>
                    <span className={getBadgeClasses()}>{event.year || '????'}</span>
                    <h4 className="text-sm font-instrument-serif text-[#3B3634] mb-1">{event.title || t('pagebuilder.blockPreview.event')}</h4>
                    {event.description && <p className="text-xs text-[#3B3634]/70 line-clamp-2">{event.description}</p>}
                  </div>
                </div>
                <div className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
        {events.length > 3 && (
          <p className="text-xs text-[#3B3634]/50 text-center">{t('pagebuilder.blockPreview.moreEvents', { count: events.length - 3 })}</p>
        )}
      </div>
    )
  }
  
  // Vertical Layout
  if (layout === 'vertical') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="relative pl-6 border-l-2 border-[#3B3634]/20 space-y-3">
          {events.slice(0, 3).map((event: any, index: number) => (
            <div key={index} className="relative">
              <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-[#3B3634] border-2 border-white" />
              <div className={`bg-[#F4F0EB] p-3 ${roundedEdges ? 'rounded-lg' : ''}`}>
                <span className={getBadgeClasses()}>{event.year || '????'}</span>
                <h4 className="text-sm font-instrument-serif text-[#3B3634] mb-1">{event.title || t('pagebuilder.blockPreview.event')}</h4>
                {event.description && <p className="text-xs text-[#3B3634]/70 line-clamp-2">{event.description}</p>}
              </div>
            </div>
          ))}
        </div>
        {events.length > 3 && (
          <p className="text-xs text-[#3B3634]/50 pl-8">{t('pagebuilder.blockPreview.moreEvents', { count: events.length - 3 })}</p>
        )}
      </div>
    )
  }
  
  // Horizontal Layout
  if (layout === 'horizontal') {
    return (
      <div className="space-y-3">
        {data.title && (
          <h3 className={titleClasses}>{data.title}</h3>
        )}
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#3B3634]/20" />
          <div className="grid grid-cols-3 gap-2">
            {events.slice(0, 3).map((event: any, index: number) => (
              <div key={index} className="relative">
                <div className="absolute top-4 left-1/2 w-2.5 h-2.5 rounded-full bg-[#3B3634] border-2 border-white transform -translate-x-1/2 z-10" />
                <div className={`bg-[#F4F0EB] p-2.5 mt-8 ${roundedEdges ? 'rounded-lg' : ''}`}>
                  <span className={getBadgeClasses()}>{event.year || '????'}</span>
                  <h4 className="text-xs font-instrument-serif text-[#3B3634] mb-1 truncate">{event.title || t('pagebuilder.blockPreview.event')}</h4>
                  {event.description && <p className="text-xs text-[#3B3634]/70 line-clamp-1">{event.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        {events.length > 3 && (
          <p className="text-xs text-[#3B3634]/50 text-center">{t('pagebuilder.blockPreview.moreEvents', { count: events.length - 3 })}</p>
        )}
      </div>
    )
  }
  
  return null
}

// Spacer Preview
const SpacerPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const height = data.height || 'medium'
  
  const heightLabels = {
    small: t('pagebuilder.blockForm.spacer.heightSmall'),
    medium: t('pagebuilder.blockForm.spacer.heightMedium'),
    large: t('pagebuilder.blockForm.spacer.heightLarge'),
    xlarge: t('pagebuilder.blockForm.spacer.heightXlarge')
  }
  
  const heightClasses = {
    small: 'h-8',
    medium: 'h-16',
    large: 'h-24',
    xlarge: 'h-32'
  }
  
  return (
    <div className="relative">
      <div className={`${heightClasses[height as keyof typeof heightClasses]} bg-gradient-to-r from-[#F4F0EB] via-[#E8E0D5] to-[#F4F0EB] border-y border-dashed border-[#3B3634]/20`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-[#3B3634]/50 font-medium bg-white/80 px-2 py-1 rounded">
            {heightLabels[height as keyof typeof heightLabels]}
          </span>
        </div>
      </div>
    </div>
  )
}

// Team Preview
const TeamPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const members = data.members || []
  const layout = data.layout || 'circular'
  const roundedEdges = data.rounded_edges !== false
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  if (members.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addMembers')}</p>
      </div>
    )
  }
  
  const gridClass = members.length === 1 
    ? 'grid-cols-1 max-w-[150px] mx-auto' 
    : members.length === 2 
      ? 'grid-cols-2 max-w-sm mx-auto' 
      : 'grid-cols-2 md:grid-cols-3'
  
  // Circular Layout
  if (layout === 'circular') {
    return (
      <div className="space-y-4">
        {(data.title || data.description) && (
          <div className="text-center">
            {data.title && (
              <h3 className={titleClasses + " mb-1"}>{data.title}</h3>
            )}
            {data.description && (
              <p className="text-xs text-[#3B3634]/70">{data.description}</p>
            )}
          </div>
        )}
        <div className={`grid ${gridClass} gap-4`}>
          {members.slice(0, 6).map((member: any, index: number) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-[#F4F0EB]">
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-instrument-serif text-[#3B3634]">{member.name || t('pagebuilder.blockPreview.member')}</p>
              {member.role && (
                <p className="text-xs text-[#3B3634]/60">{member.role}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Cards Layout
  if (layout === 'cards') {
    return (
      <div className="space-y-4">
        {(data.title || data.description) && (
          <div className="text-center">
            {data.title && (
              <h3 className={titleClasses}>{data.title}</h3>
            )}
            {data.description && (
              <p className="text-xs text-[#3B3634]/70">{data.description}</p>
            )}
          </div>
        )}
        <div className={`grid ${gridClass} gap-3`}>
          {members.slice(0, 6).map((member: any, index: number) => (
            <div key={index} className={`bg-[#F4F0EB] p-3 text-center ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className={`w-14 h-14 mx-auto mb-2 overflow-hidden bg-white ${roundedEdges ? 'rounded-lg' : ''}`}>
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-instrument-serif text-[#3B3634]">{member.name || t('pagebuilder.blockPreview.member')}</p>
              {member.role && (
                <p className="text-xs text-[#3B3634]/60">{member.role}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Minimal Layout
  return (
    <div className="space-y-3">
      {(data.title || data.description) && (
        <div className="text-center">
          {data.title && <h3 className={titleClasses + " mb-1"}>{data.title}</h3>}
          {data.description && (
            <p className="text-xs text-[#3B3634]/70">{data.description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {members.slice(0, 4).map((member: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-12 h-12 overflow-hidden bg-[#F4F0EB] ${roundedEdges ? 'rounded-lg' : ''}`}>
              {member.image_url ? (
                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-instrument-serif text-[#3B3634]">{member.name || t('pagebuilder.blockPreview.teamMember')}</p>
              {member.role && (
                <p className="text-xs text-[#3B3634]/60">{member.role}</p>
              )}
            </div>
          </div>
        ))}
        {members.length > 4 && (
          <p className="text-xs text-[#3B3634]/50">{t('pagebuilder.blockPreview.moreMembers', { count: members.length - 4 })}</p>
        )}
      </div>
    </div>
  )
}

// Categories Preview
const CategoriesPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const categories = data.categories || []
  const columns = data.columns || 3
  const layout = data.layout || 'classic'
  const roundedEdges = data.rounded_edges !== false
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  if (categories.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addCategories')}</p>
      </div>
    )
  }
  
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }
  
  // Classic Layout
  if (layout === 'classic') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className={titleClasses}>{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
          {categories.slice(0, 6).map((category: any, index: number) => (
            <div key={index} className={`bg-white overflow-hidden border border-[#3B3634]/10 ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="aspect-[4/3] bg-[#F4F0EB] relative">
                {category.image_url && <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-white text-xs font-medium truncate">{category.title || t('pagebuilder.blockPreview.category')}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Minimal Layout
  if (layout === 'minimal') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className="text-base font-instrument-serif text-center text-[#3B3634]">{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-3`}>
          {categories.slice(0, 6).map((category: any, index: number) => (
            <div key={index}>
              <div className={`aspect-[3/2] bg-[#F4F0EB] overflow-hidden mb-2 ${roundedEdges ? 'rounded-lg' : ''}`}>
                {category.image_url && <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />}
              </div>
              <h3 className="text-xs font-medium text-[#3B3634] truncate">{category.title || t('pagebuilder.blockPreview.category')}</h3>
              {category.description && <p className="text-xs text-[#666] mt-0.5 line-clamp-1">{category.description}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Bold Layout
  if (layout === 'bold') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className="text-base font-instrument-serif text-center text-[#3B3634]">{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
          {categories.slice(0, 6).map((category: any, index: number) => (
            <div key={index} className={`relative aspect-square overflow-hidden ${roundedEdges ? 'rounded-lg' : ''}`}>
              <div className="absolute inset-0 bg-[#F4F0EB]">
                {category.image_url && <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#3B3634]/80 via-[#3B3634]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-white text-xs font-medium truncate">{category.title || 'Kategoria'}</h3>
                {category.description && <p className="text-white/80 text-xs line-clamp-1">{category.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Artistic Layout
  if (layout === 'artistic') {
    return (
      <div className="space-y-3">
        {data.title && <h3 className="text-base font-instrument-serif text-center text-[#3B3634]">{data.title}</h3>}
        <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-3`}>
          {categories.slice(0, 6).map((category: any, index: number) => {
            const borderStyles = ['border-2 border-[#3B3634]', 'border border-[#8B7355]', 'border-4 border-[#F4F0EB]']
            const borderStyle = borderStyles[index % borderStyles.length]
            return (
              <div key={index} className={`bg-white p-1 shadow-md ${borderStyle} ${roundedEdges ? 'rounded-lg' : ''}`}>
                <div className="aspect-[4/3] bg-[#F4F0EB] overflow-hidden">
                  {category.image_url && <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-2 bg-primary text-center">
                  <h3 className="text-xs font-medium text-[#3B3634] truncate">{category.title || t('pagebuilder.blockPreview.category')}</h3>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  // Default fallback
  return (
    <div className="space-y-3">
      {data.title && <h3 className="text-base font-instrument-serif text-center text-[#3B3634]">{data.title}</h3>}
      <div className={`grid ${columnClasses[columns as keyof typeof columnClasses]} gap-2`}>
        {categories.slice(0, 6).map((category: any, index: number) => (
          <div key={index} className={`bg-[#F4F0EB] overflow-hidden ${roundedEdges ? 'rounded-lg' : ''}`}>
            <div className="aspect-[4/3]">
              {category.image_url && <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-2">
              <p className="text-xs truncate">{category.title || t('pagebuilder.blockPreview.category')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Behind the Scenes Preview
const BehindScenesPreview = ({ data }: { data: any }) => {
  const { t } = useTranslation()
  const media = data.media || []
  const titleAlignment = data.title_alignment || 'center'
  const titleItalic = data.title_italic || false
  
  const titleAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  const titleClasses = `text-base font-instrument-serif text-[#3B3634] ${titleAlignmentClasses[titleAlignment as keyof typeof titleAlignmentClasses]} ${titleItalic ? 'italic' : ''}`
  
  if (media.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">{t('pagebuilder.blockPreview.addBehindScenes')}</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-xl font-instrument-serif italic text-center text-[#3B3634]">{data.title}</h3>
      )}
      {data.description && (
        <p className="text-sm text-center text-[#3B3634]/70">{data.description}</p>
      )}
      <div className={`grid ${data.layout === 'grid' ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3'} gap-2`}>
        {media.slice(0, 6).map((item: any, index: number) => (
          <div key={index} className={`relative rounded-lg overflow-hidden ${index === 0 && data.layout === 'masonry' ? 'row-span-2' : ''}`}>
            {item.type === 'video' ? (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            ) : (
              <img 
                src={item.url} 
                alt={item.caption || `Media ${index + 1}`}
                className={`w-full object-cover ${index === 0 && data.layout === 'masonry' ? 'h-full' : 'aspect-square'}`}
              />
            )}
          </div>
        ))}
      </div>
      {media.length > 6 && (
        <p className="text-center text-xs text-[#3B3634]/50">{t('pagebuilder.blockPreview.moreMedia', { count: media.length - 6 })}</p>
      )}
    </div>
  )
}
  
