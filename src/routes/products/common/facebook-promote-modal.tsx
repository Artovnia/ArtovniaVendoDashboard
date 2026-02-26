import { Facebook, Share, SquareTwoStack } from "@medusajs/icons"
import {
  Badge,
  Button,
  FocusModal,
  Heading,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useState, useMemo, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

import { useProduct } from "../../../hooks/api/products"
import { fetchQuery } from "../../../lib/client"
import { generateCaptions, CaptionOption } from "../../../lib/facebook-captions"
import {
  buildProductShareUrl,
  copyToClipboard,
  openFacebookShareDialog,
  openMessengerShareDialog,
} from "../../../lib/facebook-share"

type FacebookPromoteModalProps = {
  open: boolean
  onClose: () => void
  productId: string
  vendorName?: string
  vendorId?: string
  initialProductHandle?: string
  initialProductTitle?: string
  initialProductThumbnail?: string | null
  initialProductStatus?: string
}

export const FacebookPromoteModal = ({
  open,
  onClose,
  productId,
  vendorName,
  vendorId,
  initialProductHandle,
  initialProductTitle,
  initialProductThumbnail,
  initialProductStatus,
}: FacebookPromoteModalProps) => {
  const { t } = useTranslation()

  // Fetch full product data with variants, prices, and inventory items
  const { product, isLoading: isProductLoading } = useProduct(productId, {
    fields: "title,handle,status,updated_at,thumbnail,images.url,*variants,*variants.prices,*variants.inventory_items,*categories",
  })

  // Check if variant data is available
  const hasVariantData = Boolean(product?.variants?.length)

  // Extract price from first variant
  const price = useMemo(() => {
    if (!hasVariantData || !product) return null
    const variant = product.variants![0]
    const priceObj = variant?.prices?.[0]
    if (priceObj?.amount && priceObj.amount > 0) {
      return {
        amount: priceObj.amount.toFixed(2),
        currency: priceObj.currency_code?.toUpperCase() || "PLN",
      }
    }
    return null
  }, [product?.variants, hasVariantData, product])

  // ── Stock status from inventory location levels ──
  // In Medusa, when manage_inventory is true, the real stock lives in
  // inventory location levels (stocked_quantity - reserved_quantity),
  // NOT in variant.inventory_quantity which is often null/0.
  const [stockStatus, setStockStatus] = useState<
    "loading" | "in_stock" | "limited" | "out_of_stock" | "unmanaged" | "unknown"
  >("loading")

  useEffect(() => {
    if (!hasVariantData || !product) {
      setStockStatus(isProductLoading ? "loading" : "unknown")
      return
    }

    const variants = product.variants!

    // If no variant manages inventory → unmanaged (always in stock)
    const anyManaged = variants.some((v) => v.manage_inventory !== false)
    if (!anyManaged) {
      setStockStatus("unmanaged")
      return
    }

    // Fetch real inventory from location levels for managed variants
    const fetchInventory = async () => {
      try {
        let totalAvailable = 0

        for (const variant of variants) {
          if (variant.manage_inventory === false) continue

          const inventoryItemId = (variant as any).inventory_items?.[0]?.inventory_item_id
          if (inventoryItemId) {
            try {
              const response = await fetchQuery(
                `/vendor/inventory-items/${inventoryItemId}/location-levels`,
                { method: "GET", query: { fields: "stocked_quantity,reserved_quantity" } }
              )
              const levels = response?.location_levels || response?.inventory_item_levels || []
              levels.forEach((level: any) => {
                totalAvailable += Math.max(
                  0,
                  Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)
                )
              })
            } catch {
              // Fallback to variant.inventory_quantity for this variant
              totalAvailable += Math.max(0, variant.inventory_quantity ?? 0)
            }
          } else {
            // No inventory item linked — use variant field as fallback
            totalAvailable += Math.max(0, variant.inventory_quantity ?? 0)
          }
        }

        if (totalAvailable === 0) {
          setStockStatus("out_of_stock")
        } else if (totalAvailable < 5) {
          setStockStatus("limited")
        } else {
          setStockStatus("in_stock")
        }
      } catch {
        // On complete failure, fall back to simple variant field check
        const allZero = variants
          .filter((v) => v.manage_inventory !== false)
          .every((v) => (v.inventory_quantity ?? 0) === 0)
        setStockStatus(allZero ? "out_of_stock" : "in_stock")
      }
    }

    fetchInventory()
  }, [hasVariantData, product, isProductLoading])

  const isLimitedStock = stockStatus === "limited"
  const isOutOfStock = stockStatus === "out_of_stock"
  const showStockBadge = stockStatus !== "loading" && stockStatus !== "unknown"

  // Generate caption options
  const captions = useMemo(
    () =>
      generateCaptions({
        productName: product?.title || "",
        material: product?.material,
        vendorName,
        price: price?.amount,
        currency: price?.currency,
        isLimitedStock,
        categoryName: product?.categories?.[0]?.name,
      }),
    [product, vendorName, price, isLimitedStock]
  )

  // Selected caption (editable)
  const [selectedCaptionId, setSelectedCaptionId] = useState<CaptionOption["id"]>("story")
  const [editedText, setEditedText] = useState(captions[0]?.text || "")

  useEffect(() => {
    const nextCaption = captions.find((caption) => caption.id === selectedCaptionId) || captions[0]
    if (nextCaption) {
      setEditedText(nextCaption.text)
    }
  }, [captions, selectedCaptionId])

  const resolvedHandle = product?.handle || initialProductHandle || ""
  const resolvedTitle = product?.title || initialProductTitle || ""
  const resolvedThumbnail =
    product?.thumbnail ||
    product?.images?.[0]?.url ||
    initialProductThumbnail ||
    null

  // Build share URL with UTM params
  // Add productId as a version key so Facebook treats each product share URL as unique
  // and avoids cross-product preview cache collisions.
  const shareUrl = useMemo(
    () => buildProductShareUrl(resolvedHandle, vendorId, product?.updated_at || productId),
    [resolvedHandle, vendorId, product?.updated_at, productId]
  )

  const canShare = Boolean(shareUrl)

  const handleCaptionSelect = (caption: CaptionOption) => {
    setSelectedCaptionId(caption.id)
    setEditedText(caption.text)
  }

  const handleShareFacebook = useCallback(() => {
    if (!canShare) {
      toast.error(t("fbPromote.productNotReady", "Produkt nie jest jeszcze gotowy do udostępnienia"))
      return
    }
    openFacebookShareDialog(shareUrl)
  }, [canShare, shareUrl, t])

  const handleShareMessenger = useCallback(async () => {
    if (!canShare) {
      toast.error(t("fbPromote.productNotReady", "Produkt nie jest jeszcze gotowy do udostępnienia"))
      return
    }
    const copied = await openMessengerShareDialog(shareUrl)
    if (copied) {
      toast.success(t("fbPromote.messengerLinkCopied", "Link skopiowany — wklej go w oknie Messengera"))
    }
  }, [canShare, shareUrl, t])

  const handleCopyLink = async () => {
    if (!canShare) {
      toast.error(t("fbPromote.productNotReady", "Produkt nie jest jeszcze gotowy do udostępnienia"))
      return
    }
    const success = await copyToClipboard(shareUrl)
    if (success) {
      toast.success(t("fbPromote.linkCopied", "Link skopiowany do schowka"))
    } else {
      toast.error(t("fbPromote.linkCopyFailed", "Nie udało się skopiować linku"))
    }
  }

  const handleCopyCaption = async () => {
    const success = await copyToClipboard(editedText)
    if (success) {
      toast.success(t("fbPromote.captionCopied", "Tekst skopiowany do schowka"))
    } else {
      toast.error(t("fbPromote.captionCopyFailed", "Nie udało się skopiować tekstu"))
    }
  }

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }, [onClose])

  // Prevent clicks inside the portal-rendered modal from bubbling
  // to the DataTable row Link which would cause navigation
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const resolvedStatus = product?.status || initialProductStatus
  const isPublished = !resolvedStatus || resolvedStatus === "published"

  // Render via portal to fully isolate from DataTable row Link events
  return createPortal(
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Content
        className="max-w-2xl mx-auto my-auto"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
      >
        <FocusModal.Header>
          <div className="flex items-center gap-x-2">
            <Facebook />
            <FocusModal.Title>
              {t("fbPromote.title", "Promuj na Facebooku")}
            </FocusModal.Title>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="px-4 sm:px-6 py-4 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Loading state while product data is being fetched */}
          {isProductLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ui-border-base border-t-ui-fg-base" />
            </div>
          )}

          {!isProductLoading && product && (
          <>
          {/* Warning if product is not published */}
          {!isPublished && (
            <div className="rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg p-3">
              <Text size="small" className="text-ui-tag-orange-text">
                {t(
                  "fbPromote.notPublished",
                  "Ten produkt nie jest jeszcze opublikowany. Link nie będzie działał publicznie dopóki produkt nie zostanie zatwierdzony."
                )}
              </Text>
            </div>
          )}

          {/* Product Preview Card */}
          <div className="rounded-lg border border-ui-border-base overflow-hidden">
            <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-ui-bg-subtle flex-shrink-0">
                {resolvedThumbnail ? (
                  <img
                    src={resolvedThumbnail}
                    alt={resolvedTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ui-fg-muted">
                    <Text size="xsmall">
                      {t("fbPromote.noImage", "Brak zdjęcia")}
                    </Text>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Heading level="h3" className="truncate text-sm sm:text-base">
                  {resolvedTitle}
                </Heading>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                  {price && (
                    <Text size="small" weight="plus">
                      {price.amount} {price.currency}
                    </Text>
                  )}
                  {showStockBadge && (
                    isOutOfStock ? (
                      <Badge color="red" size="2xsmall">
                        {t("fbPromote.outOfStock", "Brak w magazynie")}
                      </Badge>
                    ) : isLimitedStock ? (
                      <Badge color="orange" size="2xsmall">
                        {t("fbPromote.limitedStock", "Ograniczona ilość")}
                      </Badge>
                    ) : (
                      <Badge color="green" size="2xsmall">
                        {t("fbPromote.inStock", "Dostępne")}
                      </Badge>
                    )
                  )}
                  {stockStatus === "loading" && (
                    <Text size="xsmall" className="text-ui-fg-muted">...</Text>
                  )}
                </div>
                {vendorName && (
                  <Text size="xsmall" className="text-ui-fg-muted mt-1">
                    {t("fbPromote.by", "Od")}: {vendorName}
                  </Text>
                )}
              </div>
            </div>

            {/* OG Preview hint */}
            <div className="border-t border-ui-border-base bg-ui-bg-subtle px-3 sm:px-4 py-2">
              <Text size="xsmall" className="text-ui-fg-muted">
                {t(
                  "fbPromote.ogHint",
                  "Facebook automatycznie pobierze podgląd ze strony produktu (zdjęcie, tytuł, cenę)."
                )}
              </Text>
            </div>
          </div>
          </>
          )}

          {/* Step-by-step guide */}
          <div className="space-y-4">
            <Text size="small" weight="plus">
              {t("fbPromote.guideTitle", "Jak udostępnić produkt na Facebooku")}
            </Text>

            {/* Step 1 — Choose template */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">1</span>
                <Text size="small">
                  {t("fbPromote.step1", "Wybierz szablon tekstu (możesz go edytować)")}
                </Text>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {captions.map((caption) => (
                  <button
                    key={caption.id}
                    type="button"
                    onClick={() => handleCaptionSelect(caption)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedCaptionId === caption.id
                        ? "border-ui-fg-interactive bg-ui-bg-interactive-subtle"
                        : "border-ui-border-base hover:border-ui-border-strong"
                    }`}
                  >
                    <Text
                      size="xsmall"
                      weight="plus"
                      className={
                        selectedCaptionId === caption.id
                          ? "text-ui-fg-interactive"
                          : ""
                      }
                    >
                      {caption.labelPl}
                    </Text>
                  </button>
                ))}
              </div>

              {/* Editable Caption */}
              <div className="flex items-center justify-between">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {t("fbPromote.captionLabel", "Tekst do posta")}
                </Text>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={handleCopyCaption}
                >
                  <SquareTwoStack className="mr-1" />
                  {t("fbPromote.copyCaption", "Kopiuj tekst")}
                </Button>
              </div>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                placeholder={t(
                  "fbPromote.captionPlaceholder",
                  "Wpisz lub edytuj tekst posta..."
                )}
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                {editedText.length}/2200{" "}
                {t("fbPromote.characters", "znaków")}
              </Text>
            </div>

            {/* Step 2 — Copy caption */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">2</span>
                <Text size="small">
                  {t("fbPromote.step2", "Skopiuj tekst powyżej przyciskiem \"Kopiuj tekst\"")}
                </Text>
              </div>
            </div>

            {/* Step 3 — Share on Facebook */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">3</span>
                <Text size="small">
                  {t("fbPromote.step3", "Kliknij \"Udostępnij na Facebooku\" — w oknie Facebooka wklej skopiowany tekst do posta")}
                </Text>
              </div>
            </div>

            {/* Step 4 — Copy and paste link */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">4</span>
                <Text size="small">
                  {t("fbPromote.step4", "Skopiuj link poniżej i wklej go do posta na Facebooku")}
                </Text>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 overflow-hidden">
                  <Text size="xsmall" className="text-ui-fg-muted truncate block">
                    {shareUrl}
                  </Text>
                </div>
                <Button variant="secondary" size="small" onClick={handleCopyLink} className="flex-shrink-0">
                  <SquareTwoStack className="mr-1" />
                  {t("fbPromote.copyLink", "Kopiuj")}
                </Button>
              </div>
              {!canShare && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {t("fbPromote.linkPending", "Czekam na pełne dane produktu (handle) — spróbuj za chwilę.")}
                </Text>
              )}
            </div>
          </div>
        </FocusModal.Body>

        {/* Action Buttons — responsive: stacked on mobile, row on desktop */}
        <FocusModal.Footer className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between w-full gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              {t("actions.close", "Zamknij")}
            </Button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleShareMessenger}
                disabled={!canShare}
                className="w-full sm:w-auto"
              >
                <Share className="mr-1" />
                {t("fbPromote.sendMessenger", "Wyślij Messengerem")}
              </Button>
              <Button onClick={handleShareFacebook} disabled={!canShare} className="w-full sm:w-auto">
                <Facebook className="mr-1" />
                {t("fbPromote.shareOnFacebook", "Udostępnij na Facebooku")}
              </Button>
            </div>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>,
    document.body
  )
}
