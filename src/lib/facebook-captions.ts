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
 * - story: Personal crafting narrative
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
  const stockText = isLimitedStock ? "Zostało już niewiele sztuk." : ""

  const storyCaption = buildStoryCaptionPl({
    productName,
    materialText,
    categoryName,
  })

  const offerCaption = buildOfferCaptionPl({
    productName,
    priceText,
    stockText,
  })

  const communityCaption = buildCommunityCaptionPl({
    productName,
    categoryName,
  })

  return [
    {
      id: "story",
      label: "Artist Story",
      labelPl: "Moja historia",
      text: storyCaption,
    },
    {
      id: "offer",
      label: "Product Offer",
      labelPl: "Oferta",
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
  categoryName,
}: {
  productName: string
  materialText: string
  categoryName?: string | null
}): string => {
  const parts: string[] = []

  if (materialText) {
    parts.push(
      `Właśnie skończyłam/em pracę nad „${productName}" — robione ręcznie, ${materialText}. W końcu mogę pokazać efekt 😊`
    )
  } else {
    parts.push(
      `„${productName}" — zrobione własnoręcznie od początku do końca. W końcu mogę pokazać efekt 😊`
    )
  }

  if (categoryName) {
    parts.push(
      `Jeśli lubicie ${categoryName.toLowerCase()} to myślę, że Wam się spodoba.`
    )
  }

  parts.push("Szczegóły i więcej zdjęć w linku 👇")

  return parts.join("\n\n")
}

const buildOfferCaptionPl = ({
  productName,
  priceText,
  stockText,
}: {
  productName: string
  priceText: string
  stockText: string
}): string => {
  const parts: string[] = []

  if (priceText) {
    parts.push(
      `„${productName}" jest do kupienia za ${priceText} w moim sklepie na Artovnia.`
    )
  } else {
    parts.push(
      `„${productName}" jest już w moim sklepie na Artovnia.`
    )
  }

  if (stockText) {
    parts.push(stockText)
  }

  parts.push("Wszystko robione przeze mnie ręcznie — link niżej ✌️")

  return parts.join("\n\n")
}

const buildCommunityCaptionPl = ({
  productName,
  categoryName,
}: {
  productName: string
  categoryName?: string | null
}): string => {
  const parts: string[] = []

  parts.push(
    `Hej, mam coś nowego — „${productName}" właśnie trafiło do mojego sklepu na Artovnia.`
  )

  if (categoryName) {
    parts.push(
      `Kto szuka czegoś z kategorii ${categoryName.toLowerCase()} — zapraszam, zerknijcie 🙂`
    )
  }

  parts.push(
    `Będzie mi miło jeśli udostępnicie dalej — każde wsparcie się liczy!`
  )

  parts.push("#rękodzieło #handmade #artovnia")

  return parts.join("\n\n")
}