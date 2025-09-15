import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Button,
  Text,
  Badge,
  Container,
} from "@medusajs/ui"
import { Calendar, Tag, ShoppingBag, ChevronRight } from "@medusajs/icons"
import { PlatformPromotion } from "../../../hooks/api/platform-promotions"

interface PlatformPromotionCardProps {
  promotion: PlatformPromotion
}

export const PlatformPromotionCard = ({ promotion }: PlatformPromotionCardProps) => {
  const { t } = useTranslation()

  const formatPromotionValue = (promotion: PlatformPromotion) => {
    // Check if we have application_method with value
    if (promotion.application_method?.value) {
      const value = promotion.application_method.value
      const type = promotion.application_method.type
      
      if (type === "percentage") {
        return `${value}%`
      }
      if (type === "fixed") {
        return `${value} zł`
      }
      return `${value} ${type}`
    }
    
    // Fallback to promotion type and value if available
    if (promotion.type && promotion.value !== undefined && promotion.value !== null) {
      if (promotion.type === "percentage") {
        return `${promotion.value}%`
      }
      if (promotion.type === "fixed") {
        return `${promotion.value} zł`
      }
      return `${promotion.value} ${promotion.type}`
    }
    
    return "Campaign Promotion"
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const isActive = () => {
    const now = new Date()
    const startDate = promotion.campaign?.starts_at ? new Date(promotion.campaign.starts_at) : null
    const endDate = promotion.campaign?.ends_at ? new Date(promotion.campaign.ends_at) : null

    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    return true
  }

  const getStatusBadge = () => {
    const active = isActive()
    const hasProducts = promotion.vendor_participation?.has_products

    if (!active) {
      const now = new Date()
      const startDate = promotion.campaign?.starts_at ? new Date(promotion.campaign.starts_at) : null
      const endDate = promotion.campaign?.ends_at ? new Date(promotion.campaign.ends_at) : null

      if (startDate && now < startDate) {
        return <Badge color="orange">{t("platformPromotions.status.upcoming")}</Badge>
      }
      if (endDate && now > endDate) {
        return <Badge color="red">{t("platformPromotions.status.expired")}</Badge>
      }
    }

    if (hasProducts) {
      return <Badge color="green">{t("platformPromotions.status.participating")}</Badge>
    }

    return <Badge color="grey">{t("platformPromotions.status.available")}</Badge>
  }

  return (
    <Container className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-x-3 mb-3">
            <div className="flex items-center gap-x-2">
              <Tag className="h-4 w-4 text-ui-fg-subtle" />
              <Text className="font-semibold text-ui-fg-base">
                {promotion.code}
              </Text>
            </div>
            <Badge color="blue">
              {formatPromotionValue(promotion)}
            </Badge>
            {getStatusBadge()}
          </div>

          {/* Campaign Info */}
          {promotion.campaign && (
            <div className="mb-3">
              <Text className="font-medium text-ui-fg-base mb-1">
                {promotion.campaign.name}
              </Text>
              {promotion.campaign.description && (
                <Text className="text-sm text-ui-fg-subtle line-clamp-2">
                  {promotion.campaign.description}
                </Text>
              )}
            </div>
          )}

          {/* Dates and Products */}
          <div className="flex items-center gap-x-6 text-sm">
            <div className="flex items-center gap-x-2">
              <Calendar className="h-4 w-4 text-ui-fg-subtle" />
              <div>
                <Text className="text-ui-fg-subtle">
                  {formatDate(promotion.campaign?.starts_at)} - {formatDate(promotion.campaign?.ends_at)}
                </Text>
              </div>
            </div>
            
            {promotion.vendor_participation?.has_products && (
              <div className="flex items-center gap-x-2">
                <ShoppingBag className="h-4 w-4 text-ui-fg-subtle" />
                <Text className="text-ui-fg-subtle">
                  {t("platformPromotions.card.productsCount", { count: promotion.vendor_participation.product_count })}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-y-2 ml-4">
          <Link to={`/platform-promotions/${promotion.id}`}>
            <Button variant="secondary" size="small">
              {promotion.vendor_participation?.has_products 
                ? t("platformPromotions.card.manage")
                : t("platformPromotions.card.joinPromotion")
              }
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  )
}
