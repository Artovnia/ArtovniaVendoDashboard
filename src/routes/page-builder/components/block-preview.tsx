import { Block } from '../../../hooks/api/vendor-page'

interface BlockPreviewProps {
  block: Block
}

export const BlockPreview = ({ block }: BlockPreviewProps) => {
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
    default:
      return (
        <div className="p-4 bg-[#F4F0EB] rounded text-center text-[#3B3634]/50">
          Nieznany typ bloku: {block.type}
        </div>
      )
  }
}

const HeroPreview = ({ data }: { data: any }) => {
  const hasImage = data.image_url && data.image_url.length > 0
  const positionClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right'
  }
  
  return (
    <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 to-gray-900">
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
          <h2 className="text-xl md:text-2xl font-serif text-white mb-2">
            {data.title}
          </h2>
        ) : (
          <span className="text-white/50 text-lg">Tytuł banera...</span>
        )}
        {data.subtitle ? (
          <p className="text-sm text-white/90 max-w-md">
            {data.subtitle}
          </p>
        ) : (
          <span className="text-white/30 text-sm">Podtytuł...</span>
        )}
      </div>
    </div>
  )
}

const RichTextPreview = ({ data }: { data: any }) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  return (
    <div className={`p-4 bg-[#F4F0EB] rounded-lg space-y-3 ${alignmentClasses[data.alignment as keyof typeof alignmentClasses] || 'text-left'}`}>
      {data.heading && (
        <h3 className="text-xl font-serif italic text-[#3B3634]">{data.heading}</h3>
      )}
      {data.content ? (
        <div 
          className="prose prose-sm max-w-none text-[#3B3634]"
          dangerouslySetInnerHTML={{ __html: data.content.replace(/\n/g, '<br/>') }}
        />
      ) : !data.heading ? (
        <p className="text-[#3B3634]/50 italic">Wpisz treść tekstu...</p>
      ) : null}
    </div>
  )
}

const ImageGalleryPreview = ({ data }: { data: any }) => {
  const images = data.images || []
  const columns = data.columns || 3
  const gapClasses = {
    small: 'gap-1',
    medium: 'gap-2',
    large: 'gap-3'
  }
  
  if (images.length === 0) {
    return (
      <div className="p-8 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">Dodaj zdjęcia do galerii</p>
      </div>
    )
  }
  
  return (
    <div className={`grid grid-cols-${columns} ${gapClasses[data.gap as keyof typeof gapClasses] || gapClasses.medium}`}>
      {images.slice(0, 6).map((image: any, index: number) => (
        <div key={index} className="aspect-square overflow-hidden rounded bg-[#F4F0EB]">
          <img
            src={image.url}
            alt={image.alt || `Zdjęcie ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {images.length > 6 && (
        <div className="aspect-square flex items-center justify-center bg-[#F4F0EB] rounded text-[#3B3634]/70 text-sm">
          +{images.length - 6} więcej
        </div>
      )}
    </div>
  )
}

const ImageTextPreview = ({ data }: { data: any }) => {
  const hasImage = data.image_url && data.image_url.length > 0
  const isLeft = data.image_position === 'left'
  
  const imageElement = (
    <div className="aspect-square bg-[#F4F0EB] rounded-lg overflow-hidden flex items-center justify-center">
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
        <h3 className="text-lg font-medium mb-2 text-[#3B3634]">{data.title}</h3>
      ) : (
        <span className="text-[#3B3634]/50 italic mb-2">Tytuł sekcji...</span>
      )}
      {data.content ? (
        <p className="text-sm text-[#3B3634]/80">{data.content}</p>
      ) : (
        <span className="text-[#3B3634]/40 text-sm italic">Treść opisu...</span>
      )}
    </div>
  )
  
  return (
    <div className="grid grid-cols-2 gap-4 bg-[#F4F0EB] rounded-lg overflow-hidden">
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
  return (
    <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
      <svg className="w-8 h-8 mx-auto text-[#3B3634]/40 mb-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      {data.quote ? (
        <blockquote className="text-lg italic mb-3 text-[#3B3634]">"{data.quote}"</blockquote>
      ) : (
        <p className="text-[#3B3634]/50 italic mb-3">"Wpisz cytat..."</p>
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
          <p className="text-sm">Dodaj link do wideo</p>
        </div>
      )}
    </div>
  )
}

const ProcessPreview = ({ data }: { data: any }) => {
  const steps = data.steps || []
  
  if (steps.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">Dodaj kroki procesu</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-lg font-medium text-center text-[#3B3634]">{data.title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.slice(0, 6).map((step: any, index: number) => (
          <div key={index} className="bg-[#F4F0EB] rounded-lg p-4 flex flex-col h-full">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B3634] text-[#F4F0EB] flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate text-[#3B3634]">{step.title || `Krok ${index + 1}`}</h4>
                <p className="text-xs text-[#3B3634]/70 line-clamp-2">{step.description || 'Opis kroku...'}</p>
              </div>
            </div>
            {/* Image at bottom */}
            {step.image_url && (
              <div className="mt-3 aspect-video rounded overflow-hidden bg-[#F4F0EB]">
                <img 
                  src={step.image_url} 
                  alt={step.title || `Krok ${index + 1}`}
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

const FeaturedProductsPreview = ({ data }: { data: any }) => {
  const productCount = data.product_ids?.length || 0
  const columns = data.columns || 3
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-lg font-medium text-center text-[#3B3634]">{data.title}</h3>
      )}
      {productCount === 0 ? (
        <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
          <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-[#3B3634]/50 text-sm">Wybierz produkty do wyświetlenia</p>
        </div>
      ) : (
        <div className={`grid grid-cols-${columns} gap-3`}>
          {Array.from({ length: Math.min(productCount, 6) }).map((_, index) => (
            <div key={index} className="bg-[#F4F0EB] rounded-lg overflow-hidden">
              <div className="aspect-square bg-[#F4F0EB] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="p-2">
                <div className="h-3 bg-[#3B3634]/10 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-[#3B3634]/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {productCount > 0 && (
        <p className="text-center text-sm text-[#3B3634]/70">
          {productCount} {productCount === 1 ? 'produkt' : productCount < 5 ? 'produkty' : 'produktów'} wybranych
        </p>
      )}
    </div>
  )
}

// Timeline Preview
const TimelinePreview = ({ data }: { data: any }) => {
  const events = data.events || []
  
  if (events.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">Dodaj wydarzenia do osi czasu</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-xl font-serif italic text-center text-[#3B3634]">{data.title}</h3>
      )}
      <div className="relative pl-6 border-l-2 border-[#3B3634]/20 space-y-4">
        {events.slice(0, 4).map((event: any, index: number) => (
          <div key={index} className="relative">
            <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-[#3B3634] border-2 border-[#F4F0EB]" />
            <div className="bg-[#F4F0EB] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#3B3634]/60">{event.year || '????'}</span>
                <span className="text-sm font-medium text-[#3B3634]">{event.title || 'Wydarzenie'}</span>
              </div>
              {event.description && (
                <p className="text-xs text-[#3B3634]/70 line-clamp-2">{event.description}</p>
              )}
            </div>
          </div>
        ))}
        {events.length > 4 && (
          <p className="text-xs text-[#3B3634]/50 pl-2">+{events.length - 4} więcej wydarzeń</p>
        )}
      </div>
    </div>
  )
}

// Team Preview
const TeamPreview = ({ data }: { data: any }) => {
  const members = data.members || []
  
  if (members.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">Dodaj członków zespołu</p>
      </div>
    )
  }
  
  // Match storefront layout: center for 1-2 members
  const gridClass = members.length === 1 
    ? 'grid-cols-1 max-w-[200px] mx-auto' 
    : members.length === 2 
      ? 'grid-cols-2 max-w-md mx-auto' 
      : 'grid-cols-2 md:grid-cols-3'
  
  return (
    <div className="space-y-6">
      {(data.title || data.description) && (
        <div className="text-center max-w-2xl mx-auto">
          {data.title && (
            <h3 className="text-xl font-serif italic text-[#3B3634] mb-2">{data.title}</h3>
          )}
          {data.description && (
            <p className="text-sm text-[#3B3634]/70">{data.description}</p>
          )}
        </div>
      )}
      <div className={`grid ${gridClass} gap-6`}>
        {members.slice(0, 6).map((member: any, index: number) => (
          <div key={index} className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-[#F4F0EB]">
              {member.image_url ? (
                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <h4 className="text-base font-serif text-[#3B3634]">{member.name || 'Imię'}</h4>
            {member.role && (
              <p className="text-xs text-[#3B3634]/60 uppercase tracking-wider mt-1">{member.role}</p>
            )}
            {member.bio && (
              <p className="text-xs text-[#3B3634]/70 mt-2 line-clamp-2">{member.bio}</p>
            )}
          </div>
        ))}
      </div>
      {members.length > 6 && (
        <p className="text-center text-xs text-[#3B3634]/50">+{members.length - 6} więcej osób</p>
      )}
    </div>
  )
}

// Categories Preview
const CategoriesPreview = ({ data }: { data: any }) => {
  const categoryCount = data.category_ids?.length || 0
  const columns = data.columns || 3
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-xl font-serif italic text-center text-[#3B3634]">{data.title}</h3>
      )}
      {categoryCount === 0 ? (
        <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
          <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-[#3B3634]/50 text-sm">Wybierz kategorie do wyświetlenia</p>
        </div>
      ) : (
        <div className={`grid grid-cols-${columns} gap-3`}>
          {Array.from({ length: Math.min(categoryCount, 6) }).map((_, index) => (
            <div key={index} className="bg-[#F4F0EB] rounded-lg overflow-hidden">
              <div className="aspect-[4/3] bg-[#3B3634]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3B3634]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="p-2 text-center">
                <div className="h-3 bg-[#3B3634]/10 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {categoryCount > 0 && (
        <p className="text-center text-sm text-[#3B3634]/70">
          {categoryCount} {categoryCount === 1 ? 'kategoria' : categoryCount < 5 ? 'kategorie' : 'kategorii'} wybranych
        </p>
      )}
    </div>
  )
}

// Behind the Scenes Preview
const BehindScenesPreview = ({ data }: { data: any }) => {
  const media = data.media || []
  
  if (media.length === 0) {
    return (
      <div className="p-6 bg-[#F4F0EB] rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-[#3B3634]/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-[#3B3634]/50 text-sm">Dodaj zdjęcia i filmy zza kulis</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {data.title && (
        <h3 className="text-xl font-serif italic text-center text-[#3B3634]">{data.title}</h3>
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
        <p className="text-center text-xs text-[#3B3634]/50">+{media.length - 6} więcej</p>
      )}
    </div>
  )
}
