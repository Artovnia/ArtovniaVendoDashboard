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

export const Thumbnail = memo(({ src, alt, size = "base" }: ThumbnailProps) => {
  const dashboardThumbnailSrc = src ? getDashboardThumbnailCandidate(src) : null
  const [fallbackToOriginal, setFallbackToOriginal] = useState(false)

  useEffect(() => {
    setFallbackToOriginal(false)
  }, [src])

  const resolvedSrc = src
    ? dashboardThumbnailSrc && !fallbackToOriginal
      ? dashboardThumbnailSrc
      : src
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
          src={resolvedSrc || src}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => {
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
