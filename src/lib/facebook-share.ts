import { MEDUSA_STOREFRONT_URL } from "./storefront"

// ============================================
// Facebook Share URL Builder
// ============================================

/**
 * Create a short, non-reversible hash from a string.
 * Used to anonymize vendor IDs in UTM params so raw database IDs
 * are not exposed in public URLs.
 */
const hashVendorId = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Build a product URL with UTM tracking parameters for Facebook sharing.
 * UTM params allow Google Analytics to attribute traffic from vendor shares.
 * Vendor ID is hashed to avoid exposing raw database IDs in public URLs.
 */
export const buildProductShareUrl = (
  productHandle: string,
  vendorId?: string,
  shareVersion?: string
): string => {
  const normalizedHandle = productHandle?.trim()
  if (!normalizedHandle) {
    return ""
  }

  const normalizedStorefrontUrl = MEDUSA_STOREFRONT_URL.replace(/\/+$/, "")
  const encodedHandle = normalizedHandle
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  const baseUrl = `${normalizedStorefrontUrl}/products/${encodedHandle}`
  const params = new URLSearchParams({
    utm_source: "facebook",
    utm_medium: "organic",
    utm_campaign: "vendor_share",
    ...(vendorId && { utm_content: hashVendorId(vendorId) }),
    ...(shareVersion && { v: shareVersion }),
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Open Facebook Share Dialog in a new tab.
 * Uses the simple sharer.php URL — no SDK or permissions required.
 * Facebook will scrape OG tags from the product page for the preview.
 */
export const openFacebookShareDialog = (productUrl: string): void => {
  // Facebook's sharer can aggressively reuse cached preview data in popup flow.
  // Add a per-click URL nonce so each share opens with a unique URL variant,
  // while still pointing to the same product page.
  const nonceUrl = new URL(productUrl)
  nonceUrl.searchParams.set("fb_share_nonce", Date.now().toString(36))

  const shareUrl = new URL("https://www.facebook.com/sharer/sharer.php")
  shareUrl.searchParams.set("u", nonceUrl.toString())

  // Use a unique popup target name so browser/Facebook don't reuse an older share window.
  const popupTarget = `fb-share-${Date.now()}`
  window.open(shareUrl.toString(), popupTarget, "noopener,noreferrer,width=600,height=400")
}

/**
 * Open Facebook Messenger to send a product link.
 * Copies the link to clipboard first, then opens Messenger compose window.
 * If a Facebook App ID is provided, uses the richer dialog/send endpoint.
 */
export const openMessengerShareDialog = async (
  productUrl: string,
  fbAppId?: string
): Promise<boolean> => {
  if (fbAppId) {
    // With App ID: use the official dialog/send endpoint
    const messengerUrl = `https://www.facebook.com/dialog/send?app_id=${fbAppId}&link=${encodeURIComponent(productUrl)}&redirect_uri=${encodeURIComponent(productUrl)}`
    window.open(messengerUrl, "_blank", "noopener,noreferrer,width=600,height=400")
    return true
  }

  // Without App ID: copy link to clipboard and open Messenger compose
  const copied = await copyToClipboard(productUrl)
  window.open("https://www.messenger.com/new", "_blank", "noopener,noreferrer,width=600,height=600")
  return copied
}

/**
 * Copy text to clipboard with fallback for older browsers.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand("copy")
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
