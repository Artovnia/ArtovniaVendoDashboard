import { Container, Heading, Text } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../../../../lib/client"
import { useTranslation } from "react-i18next"
import { InventoryTypes } from "@medusajs/types"
import { useNavigate } from "react-router-dom"

type AttributeValue = {
  id?: string
  value?: string
  attribute_id?: string
  attribute_name?: string
  attribute?: {
    id?: string
    name?: string
    handle?: string
    ui_component?: string
  }
}

type VariantAttributesSectionProps = {
  inventoryItem: InventoryTypes.InventoryItemDTO
  variant?: {
    id: string
    product_id: string
  }
}

export const VariantAttributesSection = ({
  inventoryItem,
  variant,
}: VariantAttributesSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // Only fetch attributes if we have a valid variant with product_id and variant_id
  const enabled = Boolean(variant?.product_id && variant?.id)
  const productId = variant?.product_id
  const variantId = variant?.id
  
  // Fetch variant attributes from our custom endpoint
  const { data: attributeData, isLoading } = useQuery({
    queryKey: [`variant-attributes-${productId}-${variantId}`],
    queryFn: async () => {
      if (!productId || !variantId) return { attribute_values: [] }
      
      try {
        const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}/attributes`, {
          method: "GET"
        })
        console.log('[DEBUG] Variant attributes response:', response)
        return response
      } catch (error) {
        console.error('[DEBUG] Error fetching variant attributes:', error)
        return { attribute_values: [] }
      }
    },
    enabled,
    placeholderData: { attribute_values: [] }
  })
  
  const attributeValues = attributeData?.attribute_values || []
  
  // Create a lookup of attribute IDs to attribute names
  const attributeMap = new Map<string, string>()
  if (Array.isArray(attributeValues)) {
    attributeValues.forEach((attr: AttributeValue) => {
      if (attr.attribute_id && (attr.attribute_name || attr.attribute?.name)) {
        attributeMap.set(attr.attribute_id, attr.attribute_name || attr.attribute?.name || '')
      }
    })
  }
  
  const handleEdit = () => {
    if (productId && variantId) {
      // Navigate to the variant attributes drawer
      // This keeps the user in the inventory context
      navigate(`variant-attributes`)
    }
  }
  
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.variant.attributes.title", "Dodatkowe atrybuty wariantu")}</Heading>
        {variant && (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit", "Edytuj"),
                    onClick: handleEdit,
                    icon: <PencilSquare />,
                  },
                ],
              },
            ]}
          />
        )}
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-y-2 py-2">
            <div className="h-4 w-32 animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-48 animate-pulse rounded-md bg-gray-100" />
          </div>
        ) : attributeValues.length > 0 ? (
          <div className="flex flex-col gap-2">
            {attributeValues.map((attr: AttributeValue, index: number) => {
              // Handle various possible attribute structures, prioritizing name over ID
              const attributeName = attr.attribute_name || 
                                   attr.attribute?.name || 
                                   (attr.attribute_id ? attributeMap.get(attr.attribute_id) || null : null) || 
                                   `Atrybut ${index + 1}`
              
              return (
                <div key={attr.id || index} className="flex justify-between">
                  <Text size="small" className="text-ui-fg-subtle">
                    {attributeName}
                  </Text>
                  <Text size="small">{attr.value}</Text>
                </div>
              )
            })}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            {variant 
              ? t("products.variant.attributes.empty", "Brak dodatkowych atrybutów przypisanych do wariantu.")
              : t("products.variant.attributes.no_variant", "Brak powiązanego wariantu produktu.")}
          </Text>
        )}
      </div>
    </Container>
  )
}
