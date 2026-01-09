import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useMemo, useEffect, useState } from "react"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { Thumbnail } from "../../../../../components/common/thumbnail"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { useProductCategories } from "../../../../../hooks/api/categories"
import { fetchQuery } from "../../../../../lib/client"

type PromotionProductsSectionProps = {
  promotion: HttpTypes.AdminPromotion
}

export const PromotionProductsSection = ({
  promotion,
}: PromotionProductsSectionProps) => {
  const { t } = useTranslation()

  // Extract product and category IDs from target rules
  const { productIds, categoryIds } = useMemo(() => {
    const targetRules = promotion.application_method?.target_rules || []
    
    console.log('[PromotionProductsSection] Target rules:', targetRules)
    
    const productRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.id'
    )
    const categoryRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.categories.id'
    )

    console.log('[PromotionProductsSection] Product rule:', productRule)
    console.log('[PromotionProductsSection] Category rule:', categoryRule)

    // Extract string values from BasePromotionRuleValue objects
    const extractIds = (values: any[] | undefined): string[] => {
      if (!values) return []
      return values.map(v => typeof v === 'string' ? v : v.value)
    }

    const extractedProductIds = extractIds(productRule?.values)
    const extractedCategoryIds = extractIds(categoryRule?.values)

    console.log('[PromotionProductsSection] Extracted product IDs:', extractedProductIds)
    console.log('[PromotionProductsSection] Extracted category IDs:', extractedCategoryIds)

    return {
      productIds: extractedProductIds,
      categoryIds: extractedCategoryIds,
    }
  }, [promotion])

  // Fetch products individually since vendor API doesn't support id filter
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      if (productIds.length === 0) {
        setProducts([])
        return
      }

      setIsLoadingProducts(true)
      try {
        const productPromises = productIds.map(id =>
          fetchQuery(`/vendor/products/${id}`, {
            method: 'GET',
            query: { fields: 'id,title,thumbnail' },
          })
        )
        const fetchedProducts = await Promise.all(productPromises)
        console.log('[PromotionProductsSection] Fetched products:', fetchedProducts)
        setProducts(fetchedProducts.map((p: any) => p.product))
      } catch (error) {
        console.error('[PromotionProductsSection] Error fetching products:', error)
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [productIds])

  // Fetch categories if we have category IDs
  const { product_categories, isLoading: isLoadingCategories } = useProductCategories(
    {
      id: categoryIds.length > 0 ? categoryIds : undefined,
      fields: 'id,name,handle',
      limit: 100,
    },
    {
      enabled: categoryIds.length > 0,
    }
  )

  console.log('[PromotionProductsSection] Products:', products, 'Loading:', isLoadingProducts)
  console.log('[PromotionProductsSection] Categories:', product_categories, 'Loading:', isLoadingCategories)

  const hasProducts = products && products.length > 0
  const hasCategories = product_categories && product_categories.length > 0
  const hasNoTargets = !hasProducts && !hasCategories

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <Heading>
            {t('promotions.fields.conditions.target-rules.title')}
          </Heading>
        </div>

        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `target-rules/edit`,
                },
              ],
            },
          ]}
        />
      </div>

      <div className="px-6 pb-4 pt-2">
        {hasNoTargets && (
          <NoRecords
            className="h-[180px]"
            title={t("general.noRecordsTitle")}
            message={t("promotions.conditions.list.noRecordsMessage")}
            action={{
              to: `target-rules/edit`,
              label: t("promotions.conditions.add"),
            }}
            buttonVariant="transparentIconLeft"
          />
        )}

        {hasProducts && (
          <div className="mb-4">
            <Text size="small" weight="plus" leading="compact" className="mb-3">
              {t("promotions.fields.products")} ({products.length})
            </Text>
            <div className="flex flex-col gap-2">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center gap-3 p-2 bg-ui-bg-subtle rounded-md hover:bg-ui-bg-subtle-hover transition-colors"
                >
                  <Thumbnail src={product.thumbnail || undefined} size="small" />
                  <Text size="small">{product.title}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasCategories && (
          <div>
            <Text size="small" weight="plus" leading="compact" className="mb-3">
              {t("promotions.fields.categories")} ({product_categories.length})
            </Text>
            <div className="flex flex-wrap gap-2">
              {product_categories.map((category) => (
                <Badge key={category.id} size="small">
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
