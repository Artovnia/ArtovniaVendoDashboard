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
  vendorId?: string
): string => {
  const baseUrl = `${MEDUSA_STOREFRONT_URL}/products/${productHandle}`
  const params = new URLSearchParams({
    utm_source: "facebook",
    utm_medium: "organic",
    utm_campaign: "vendor_share",
    ...(vendorId && { utm_content: hashVendorId(vendorId) }),
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Open Facebook Share Dialog in a new tab.
 * Uses the simple sharer.php URL — no SDK or permissions required.
 * Facebook will scrape OG tags from the product page for the preview.
 */
export const openFacebookShareDialog = (productUrl: string): void => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400")
}

/**
 * Open Facebook Messenger deep link to send a product link.
 * Uses the Messenger share URL — no SDK or permissions required.
 * The recipient sees the OG preview of the product page.
 */
export const openMessengerShareDialog = (
  productUrl: string,
  fbAppId?: string
): void => {
  // If we have an FB App ID, use the richer dialog; otherwise use basic share
  const messengerUrl = fbAppId
    ? `https://www.facebook.com/dialog/send?app_id=${fbAppId}&link=${encodeURIComponent(productUrl)}&redirect_uri=${encodeURIComponent(productUrl)}`
    : `https://www.facebook.com/msg/share/?link=${encodeURIComponent(productUrl)}`
  window.open(messengerUrl, "_blank", "noopener,noreferrer,width=600,height=400")
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
