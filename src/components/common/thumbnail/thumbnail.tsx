import { memo } from "react"
import { Photo } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

type ThumbnailProps = {
  src?: string | null
  alt?: string
  size?: "small" | "base"
}

const isRemoteHttpUrl = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://")

const buildNetlifyImageUrl = (
  imageUrl: string,
  width: number,
  quality: number
): string => {
  const params = new URLSearchParams({
    url: imageUrl,
    w: String(width),
    q: String(quality),
    fit: "cover",
  })

  return `/.netlify/images?${params.toString()}`
}

const getOptimizedThumbnail = (
  src: string,
  size: "small" | "base"
): { src: string; srcSet?: string } => {
  const useNetlifyImageCdn = import.meta.env.VITE_USE_NETLIFY_IMAGE_CDN === "true"
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

  if (!useNetlifyImageCdn || isLocalhost || !isRemoteHttpUrl(src)) {
    return { src }
  }

  const targetWidth = size === "small" ? 16 : 24
  const x1 = buildNetlifyImageUrl(src, targetWidth, 55)
  const x2 = buildNetlifyImageUrl(src, targetWidth * 2, 55)

  return {
    src: x1,
    srcSet: `${x1} 1x, ${x2} 2x`,
  }
}

export const Thumbnail = memo(({ src, alt, size = "base" }: ThumbnailProps) => {
  const optimized = src ? getOptimizedThumbnail(src, size) : null
  
  return (
    <div
      className={clx(
        "bg-ui-bg-component border-ui-border-base flex items-center justify-center overflow-hidden rounded border",
        {
          "h-8 w-6": size === "base",
          "h-5 w-4": size === "small",
        }
      )}
    >
      {src ? (
        <img
          src={optimized?.src || src}
          srcSet={optimized?.srcSet}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Photo className="text-ui-fg-subtle" />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if src or size changed
  return prevProps.src === nextProps.src && prevProps.size === nextProps.size
})
