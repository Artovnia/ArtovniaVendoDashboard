import {
  ArrowDownTray,
  ThumbnailBadge,
  Trash,
  TriangleLeftMini,
  TriangleRightMini,
} from "@medusajs/icons"
import { Button, IconButton, Text, Tooltip, clx, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { toast } from "@medusajs/ui"

import { HttpTypes } from "@medusajs/types"
import { RouteFocusModal } from "../../../../../../src/components/modals"
import { useUpdateProduct } from "../../../../../../src/hooks/api/products"

type ProductMediaGalleryProps = {
  product: HttpTypes.AdminProduct
}

export const ProductMediaGallery = ({ product }: ProductMediaGalleryProps) => {
  const { state } = useLocation()
  const [curr, setCurr] = useState<number>(state?.curr || 0)

  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useUpdateProduct()

  const media = getMedia(product.images, product.thumbnail)

  const next = useCallback(() => {
    if (isPending) {
      return
    }

    setCurr((prev) => (prev + 1) % media.length)
  }, [media, isPending])

  const prev = useCallback(() => {
    if (isPending) {
      return
    }

    setCurr((prev) => (prev - 1 + media.length) % media.length)
  }, [media, isPending])

  const goTo = useCallback(
    (index: number) => {
      if (isPending) {
        return
      }

      setCurr(index)
    },
    [isPending]
  )

  const handleDownloadCurrent = () => {
    if (isPending) {
      return
    }

    const a = document.createElement("a") as HTMLAnchorElement & {
      download: string
    }

    a.href = media[curr].url
    a.download = "image"
    a.target = "_blank"

    a.click()
  }

  const handleDeleteCurrent = async () => {
    // Exit early if no media is available
    if (!media.length || media.length === 0) {
      return;
    }
    
    const current = media[curr];
    
    console.log('Attempting to delete image:', current.id, 'from product:', product.id);

    // Confirm deletion with user
    const res = await prompt({
      title: t("general.areYouSure"),
      description: current.isThumbnail
        ? t("products.media.deleteWarningWithThumbnail", { count: 1 })
        : t("products.media.deleteWarning", { count: 1 }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }
    
    try {
      // Keep all images except the one being deleted
      const mediaToKeep =
        product.images
          ?.filter((i) => i.id !== current.id)
          .map((i) => ({ url: i.url, id: i.id })) || [];

      // Update current position if needed
      if (curr === media.length - 1 && curr > 0) {
        setCurr((prev) => prev - 1);
      }

      console.log(`Deleting image from product ${product.id}, remaining images:`, mediaToKeep);

      // Call the API to update the product
      const response = await mutateAsync({
        id: product.id,
        images: mediaToKeep,
        thumbnail: current.isThumbnail ? "" : undefined,
      });
      
      console.log('Image deleted successfully, API response:', response);
      
      // Add toast notification for successful deletion
      toast.success("Zdjęcie usunięte");
      
      // If no images left, refresh to show empty state
      if (mediaToKeep.length === 0) {
        // Force a refresh of the component
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Wystąpił błąd podczas usuwania zdjęcia");
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        next()
      } else if (e.key === "ArrowLeft") {
        prev()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [next, prev])

  const noMedia = !media.length

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <RouteFocusModal.Header>
        <div className="flex items-center justify-end gap-x-2">
          <IconButton
            size="small"
            type="button"
            onClick={handleDeleteCurrent}
            disabled={noMedia}
          >
            <Trash />
            <span className="sr-only">
              {t("products.media.deleteImageLabel")}
            </span>
          </IconButton>
          <IconButton
            size="small"
            type="button"
            onClick={handleDownloadCurrent}
            disabled={noMedia}
          >
            <ArrowDownTray />
            <span className="sr-only">
              {t("products.media.downloadImageLabel")}
            </span>
          </IconButton>
          <Button variant="secondary" size="small" asChild>
            <Link to={{ pathname: ".", search: "view=edit" }}>
              {t("actions.edit")}
            </Link>
          </Button>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="flex flex-col overflow-hidden">
        <Canvas curr={curr} media={media} />
        <Preview
          curr={curr}
          media={media}
          prev={prev}
          next={next}
          goTo={goTo}
        />
      </RouteFocusModal.Body>
    </div>
  )
}

const Canvas = ({ media, curr }: { media: Media[]; curr: number }) => {
  const { t } = useTranslation()

  if (media.length === 0) {
    return (
      <div className="bg-ui-bg-subtle flex size-full flex-col items-center justify-center gap-y-4 pb-8 pt-6">
        <div className="flex flex-col items-center">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-subtle"
          >
            {t("products.media.emptyState.header")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("products.media.emptyState.description")}
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="?view=edit">{t("products.media.emptyState.action")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-ui-bg-subtle relative size-full overflow-hidden">
      <div className="flex size-full items-center justify-center p-6">
        <div className="relative inline-block max-h-full max-w-full">
          {media[curr].isThumbnail && (
            <div className="absolute left-2 top-2">
              <Tooltip content={t("products.media.thumbnailTooltip")}>
                <ThumbnailBadge />
              </Tooltip>
            </div>
          )}
          <img
            src={media[curr].url}
            alt=""
            className="object-fit shadow-elevation-card-rest max-h-[calc(100vh-200px)] w-auto rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  )
}

const MAX_VISIBLE_ITEMS = 8

const Preview = ({
  media,
  curr,
  prev,
  next,
  goTo,
}: {
  media: Media[]
  curr: number
  prev: () => void
  next: () => void
  goTo: (index: number) => void
}) => {
  if (!media.length) {
    return null
  }

  const getVisibleItems = (media: Media[], index: number) => {
    if (media.length <= MAX_VISIBLE_ITEMS) {
      return media
    }

    const half = Math.floor(MAX_VISIBLE_ITEMS / 2)
    const start = (index - half + media.length) % media.length
    const end = (start + MAX_VISIBLE_ITEMS) % media.length

    if (end < start) {
      return [...media.slice(start), ...media.slice(0, end)]
    } else {
      return media.slice(start, end)
    }
  }

  const visibleItems = getVisibleItems(media, curr)

  return (
    <div className="flex shrink-0 items-center justify-center gap-x-2 border-t p-3">
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={prev}
      >
        <TriangleLeftMini />
      </IconButton>
      <div className="flex items-center gap-x-2">
        {visibleItems.map((item) => {
          const isCurrentImage = item.id === media[curr].id
          const originalIndex = media.findIndex((i) => i.id === item.id)

          return (
            <button
              type="button"
              onClick={() => goTo(originalIndex)}
              className={clx(
                "transition-fg size-7 overflow-hidden rounded-[4px] outline-none",
                {
                  "shadow-borders-focus": isCurrentImage,
                }
              )}
              key={item.id}
            >
              <img src={item.url} alt="" className="size-full object-cover" />
            </button>
          )
        })}
      </div>
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={next}
      >
        <TriangleRightMini />
      </IconButton>
    </div>
  )
}

type Media = {
  id: string
  url: string
  isThumbnail: boolean
}

const getMedia = (
  images: HttpTypes.AdminProductImage[] | null,
  thumbnail: string | null
) => {
  const media: Media[] =
    images?.map((image) => ({
      id: image.id,
      url: image.url,
      isThumbnail: image.url === thumbnail,
    })) || []

  if (thumbnail && !media.some((mediaItem) => mediaItem.isThumbnail)) {
    media.unshift({
      id: "thumbnail_only",
      url: thumbnail,
      isThumbnail: true,
    })
  }

  return media
}
