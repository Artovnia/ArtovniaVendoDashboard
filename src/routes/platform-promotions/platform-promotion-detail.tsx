import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Button,
  Container,
  Heading,
  Text,
  Badge,
  Skeleton,
  Alert,
  Checkbox,
} from "@medusajs/ui"
import { ArrowLeft, Tag, Calendar, Users, ShoppingBag, Trash } from "@medusajs/icons"
import { 
  usePlatformPromotion,
  useAddProductsToPromotion,
  useRemoveProductsFromPromotion 
} from "../../hooks/api/platform-promotions"
import { ProductSelector } from "./components/product-selector"
import { SingleColumnPage } from "../../components/layout/pages"

export const PlatformPromotionDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)

  const {
    data,
    isLoading,
    error,
    isError,
  } = usePlatformPromotion(id!, { enabled: !!id })

  const addProductsMutation = useAddProductsToPromotion(id!)
  const removeProductsMutation = useRemoveProductsFromPromotion(id!)

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return
    
    await addProductsMutation.mutateAsync({
      product_ids: selectedProducts
    })
    
    setSelectedProducts([])
    setShowProductSelector(false)
  }

  const handleRemoveProducts = async (productIds: string[]) => {
    await removeProductsMutation.mutateAsync({
      product_ids: productIds
    })
  }

  const formatPromotionValue = (promotion: any) => {
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
    
    return t("platformPromotions.campaignPromotion")
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t("platformPromotions.noDate")
    return new Date(dateString).toLocaleDateString()
  }

  if (isError) {
    return (
      <SingleColumnPage
        widgets={{
          after: [],
          before: [],
        }}
      >
        <Container className="divide-y p-0">
          <div className="flex items-center gap-x-2 px-6 py-4">
            <Button
              variant="transparent"
              onClick={() => navigate("/platform-promotions")}
              className="mr-2"
            >
              <ArrowLeft />
            </Button>
            <Tag className="text-ui-fg-base" />
            <Heading level="h2">Platform Promotion Details</Heading>
          </div>
          <div className="px-6 py-4">
            <Alert variant="error">
              <Text>{t("platformPromotions.errorLoading")}: {error?.message}</Text>
            </Alert>
          </div>
        </Container>
      </SingleColumnPage>
    )
  }

  if (isLoading) {
    return (
      <SingleColumnPage
        widgets={{
          after: [],
          before: [],
        }}
      >
        <Container className="divide-y p-0">
          <div className="flex items-center gap-x-2 px-6 py-4">
            <Button
              variant="transparent"
              onClick={() => navigate("/platform-promotions")}
              className="mr-2"
            >
              <ArrowLeft />
            </Button>
            <Tag className="text-ui-fg-base" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="px-6 py-4 space-y-6">
            <Container className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Container>
            <Container className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </Container>
          </div>
        </Container>
      </SingleColumnPage>
    )
  }

  const promotion = data?.promotion

  if (!promotion) {
    return (
      <SingleColumnPage
        widgets={{
          after: [],
          before: [],
        }}
      >
        <Container className="divide-y p-0">
          <div className="flex items-center gap-x-2 px-6 py-4">
            <Button
              variant="transparent"
              onClick={() => navigate("/platform-promotions")}
              className="mr-2"
            >
              <ArrowLeft />
            </Button>
            <Tag className="text-ui-fg-base" />
            <Heading level="h2">Platform Promotion Details</Heading>
          </div>
          <div className="px-6 py-4">
            <Alert variant="warning">
              <Text>{t("platformPromotions.promotionNotFound")}</Text>
            </Alert>
          </div>
        </Container>
      </SingleColumnPage>
    )
  }

  return (
    <SingleColumnPage
      widgets={{
        after: [],
        before: [],
      }}
    >
      <Container className="divide-y p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-2">
            <Button
              variant="transparent"
              onClick={() => navigate("/platform-promotions")}
              className="mr-2"
            >
              <ArrowLeft />
            </Button>
            <Tag className="text-ui-fg-base" />
            <Heading level="h2">{promotion.code}</Heading>
          </div>
          <div className="flex items-center gap-x-2">
            <Badge color={promotion.vendor_participation?.has_products ? "green" : "grey"}>
              {promotion.vendor_participation?.has_products 
                ? t("platformPromotions.participating")
                : t("platformPromotions.notParticipating")
              }
            </Badge>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
        {/* Promotion Details */}
        <Container className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Heading level="h3" className="mb-2">
                {t("platformPromotions.detail.promotionDetails")}
              </Heading>
              {promotion.campaign && (
                <Text className="text-ui-fg-subtle mb-2">
                  {t("platformPromotions.detail.campaign")}: {promotion.campaign.name}
                </Text>
              )}
            </div>
            <Badge color="blue">
              {formatPromotionValue(promotion)}
            </Badge>
          </div>

          {promotion.campaign?.description && (
            <Text className="text-ui-fg-base mb-4">
              {promotion.campaign.description}
            </Text>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-x-2">
              <Calendar className="h-4 w-4 text-ui-fg-subtle" />
              <div>
                <Text className="text-ui-fg-subtle">
                  {t("platformPromotions.detail.startDate")}
                </Text>
                <Text className="font-medium">
                  {formatDate(promotion.campaign?.starts_at)}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <Calendar className="h-4 w-4 text-ui-fg-subtle" />
              <div>
                <Text className="text-ui-fg-subtle">
                  {t("platformPromotions.detail.endDate")}
                </Text>
                <Text className="font-medium">
                  {formatDate(promotion.campaign?.ends_at)}
                </Text>
              </div>
            </div>
          </div>
        </Container>

        {/* Your Products in Promotion */}
        <Container className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-x-2">
              <ShoppingBag className="h-5 w-5 text-ui-fg-base" />
              <Heading level="h3">
                {t("platformPromotions.detail.yourProducts")}
              </Heading>
              {promotion.vendor_participation?.product_count && (
                promotion.vendor_participation.product_count
              )}
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowProductSelector(true)}
            >
              {t("platformPromotions.detail.addProducts")}
            </Button>
          </div>

          {promotion.vendor_participation?.products_in_promotion?.length ? (
            <div className="overflow-hidden">
              {promotion.vendor_participation.products_in_promotion.map((product) => (
                <div
                  key={product.id}
                  className="flex h-full w-full items-center gap-x-3 overflow-hidden px-6 py-4 border-b border-ui-border-base last:border-b-0 hover:bg-ui-bg-subtle-hover transition-colors"
                >
                  <div className="w-fit flex-shrink-0">
                    <div className="bg-ui-bg-component border-ui-border-base flex items-center justify-center overflow-hidden rounded border h-8 w-6">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <ShoppingBag className="text-ui-fg-subtle h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className="font-medium text-ui-fg-base truncate">
                      {product.title}
                    </Text>
                    <Text className="text-sm text-ui-fg-subtle truncate">
                      {product.handle}
                    </Text>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleRemoveProducts([product.id])}
                      disabled={removeProductsMutation.isPending}
                      className="text-ui-fg-muted hover:text-ui-fg-subtle"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-ui-fg-subtle" />
              </div>
              <Text className="text-ui-fg-subtle">
                {t("platformPromotions.detail.noProductsAdded")}
              </Text>
            </div>
          )}
        </Container>
        </div>
      </Container>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelector
          selectedProducts={selectedProducts}
          onSelectionChange={setSelectedProducts}
          onConfirm={handleAddProducts}
          onCancel={() => {
            setShowProductSelector(false)
            setSelectedProducts([])
          }}
          isLoading={addProductsMutation.isPending}
        />
      )}
    </SingleColumnPage>
  )
}
