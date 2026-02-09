// ============================================
// Facebook Caption Templates for Vendor Product Sharing
// ============================================
// Deterministic caption generation — no AI, no runtime API calls.
// Variables are filled from product + vendor data.

export interface CaptionInput {
  productName: string
  material?: string | null
  vendorName?: string
  price?: string
  currency?: string
  isLimitedStock?: boolean
  categoryName?: string | null
}

export interface CaptionOption {
  id: "story" | "offer" | "community"
  label: string
  labelPl: string
  text: string
}

/**
 * Generate 3 pre-filled caption options for a product.
 * Each caption is designed for a different Facebook sharing style:
 * - story: Artist/handmade narrative
 * - offer: Price/availability focus
 * - community: Support small business appeal
 */
export const generateCaptions = (input: CaptionInput): CaptionOption[] => {
  const {
    productName,
    material,
    vendorName,
    price,
    currency = "PLN",
    isLimitedStock,
    categoryName,
  } = input

  const priceText = price ? `${price} ${currency}` : ""
  const materialText = material || ""
  const stockText = isLimitedStock ? "Ograniczona ilość!" : ""

  // Story-based caption (handmade / artist narrative)
  const storyCaption = buildStoryCaptionPl({
    productName,
    materialText,
    vendorName,
    categoryName,
  })

  // Offer-based caption (price / limited stock)
  const offerCaption = buildOfferCaptionPl({
    productName,
    priceText,
    stockText,
    vendorName,
  })

  // Community-based caption (support small business)
  const communityCaption = buildCommunityCaptionPl({
    productName,
    vendorName,
    categoryName,
  })

  return [
    {
      id: "story",
      label: "Artist Story",
      labelPl: "Historia artysty",
      text: storyCaption,
    },
    {
      id: "offer",
      label: "Product Offer",
      labelPl: "Oferta produktu",
      text: offerCaption,
    },
    {
      id: "community",
      label: "Support Handmade",
      labelPl: "Wspieraj rękodzieło",
      text: communityCaption,
    },
  ]
}

// ============================================
// Polish caption builders
// ============================================

const buildStoryCaptionPl = ({
  productName,
  materialText,
  vendorName,
  categoryName,
}: {
  productName: string
  materialText: string
  vendorName?: string
  categoryName?: string | null
}): string => {
  const parts: string[] = []

  if (materialText) {
    parts.push(
      `Stworzyłem/am "${productName}" ręcznie z użyciem ${materialText}. Każdy egzemplarz jest wyjątkowy.`
    )
  } else {
    parts.push(
      `Stworzyłem/am "${productName}" ręcznie. Każdy egzemplarz jest wyjątkowy.`
    )
  }

  if (categoryName) {
    parts.push(`Kategoria: ${categoryName}`)
  }

  if (vendorName) {
    parts.push(`~ ${vendorName}, Artovnia`)
  }

  return parts.join("\n\n")
}

const buildOfferCaptionPl = ({
  productName,
  priceText,
  stockText,
  vendorName,
}: {
  productName: string
  priceText: string
  stockText: string
  vendorName?: string
}): string => {
  const parts: string[] = []

  if (priceText) {
    parts.push(`"${productName}" — teraz dostępne za ${priceText}`)
  } else {
    parts.push(`"${productName}" — teraz dostępne na Artovnia`)
  }

  if (stockText) {
    parts.push(stockText)
  }

  parts.push("Handmade z pasją. Zobacz szczegóły w linku poniżej.")

  if (vendorName) {
    parts.push(`Od: ${vendorName}`)
  }

  return parts.join("\n\n")
}

const buildCommunityCaptionPl = ({
  productName,
  vendorName,
  categoryName,
}: {
  productName: string
  vendorName?: string
  categoryName?: string | null
}): string => {
  const parts: string[] = []

  parts.push(
    `Wspieraj polskie rękodzieło! "${productName}" jest teraz dostępne na Artovnia.`
  )

  if (categoryName) {
    parts.push(`Odkryj więcej w kategorii: ${categoryName}`)
  }

  if (vendorName) {
    parts.push(
      `Kupując od ${vendorName}, wspierasz niezależnego artystę.`
    )
  }

  parts.push("#handmade #rękodzieło #polskisztuka #artovnia")

  return parts.join("\n\n")
}
