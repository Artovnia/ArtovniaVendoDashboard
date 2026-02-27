import { memo, useEffect, useState } from "react"
import { Photo } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

type ThumbnailProps = {
  src?: string | null
  alt?: string
  size?: "small" | "base"
}

const isRemoteHttpUrl = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://")

const getDashboardThumbnailCandidate = (src: string): string | null => {
  if (!isRemoteHttpUrl(src) || src.includes("-thumb-96.webp")) {
    return null
  }

  try {
    const sourceUrl = new URL(src)
    const pathname = sourceUrl.pathname
    const extensionIndex = pathname.lastIndexOf(".")

    if (extensionIndex === -1) {
      return null
    }

    sourceUrl.pathname = `${pathname.slice(0, extensionIndex)}-thumb-96.webp`
    return sourceUrl.toString()
  } catch {
    return null
  }
}

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
  size: "small" | "base",
  forceDisableNetlifyCdn: boolean = false
): { src: string; srcSet?: string } => {
  const useNetlifyImageCdn = import.meta.env.VITE_USE_NETLIFY_IMAGE_CDN === "true"
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const isLocalhostLike =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")

  if (
    !useNetlifyImageCdn ||
    forceDisableNetlifyCdn ||
    isLocalhostLike ||
    !isRemoteHttpUrl(src)
  ) {
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
  const dashboardThumbnailSrc = src ? getDashboardThumbnailCandidate(src) : null
  const [fallbackToOriginal, setFallbackToOriginal] = useState(false)
  const [disableNetlifyCdnForThisImage, setDisableNetlifyCdnForThisImage] = useState(false)

  useEffect(() => {
    setFallbackToOriginal(false)
    setDisableNetlifyCdnForThisImage(false)
  }, [src])

  const resolvedSrc = src
    ? dashboardThumbnailSrc && !fallbackToOriginal
      ? dashboardThumbnailSrc
      : src
    : null

  const optimized = resolvedSrc
    ? getOptimizedThumbnail(resolvedSrc, size, disableNetlifyCdnForThisImage)
    : null
  
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
          src={optimized?.src || resolvedSrc || src}
          srcSet={optimized?.srcSet}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          referrerPolicy="no-referrer"
          onError={() => {
            if (!disableNetlifyCdnForThisImage) {
              setDisableNetlifyCdnForThisImage(true)
              return
            }

            if (dashboardThumbnailSrc && !fallbackToOriginal) {
              setFallbackToOriginal(true)
            }
          }}
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
