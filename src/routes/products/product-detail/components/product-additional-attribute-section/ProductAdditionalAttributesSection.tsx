import { Container, Heading, Text } from "@medusajs/ui"

import { HttpTypes } from "@medusajs/types"
import { PencilSquare } from "@medusajs/icons"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../../../../lib/client"
import { useTranslation } from "react-i18next"

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
  name?: string
}

type ProductAttributeSectionProps = {
  product: HttpTypes.AdminProduct & { attribute_values?: any[] }
}

export const ProductAdditionalAttributesSection = ({
  product,
}: ProductAttributeSectionProps) => {
  const { t } = useTranslation()
  const { attribute_values = [] } = product
  const productId = product?.id
  
  
  // Fetch attribute data from our custom endpoint to ensure we have proper names
  const { data: attributeData } = useQuery({
    queryKey: [`product-attributes-enhanced-${productId}`],
    queryFn: async () => {
      if (!productId) return { attribute_values: [] }
      
      try {
        const response = await fetchQuery(`/vendor/products/${productId}/attributes`, {
          method: "GET"
        })
        return response
      } catch (error) {
       
        return { attribute_values: [] }
      }
    },
    // Only run this query if we have attribute values and a product ID
    enabled: Boolean(productId && attribute_values.length > 0),
    // Use existing attribute values while loading
    placeholderData: { attribute_values }
  })
  
  // Use enhanced attribute values if available, otherwise fall back to product.attribute_values
  const enhancedAttributeValues = attributeData?.attribute_values || attribute_values
  
  // Create a lookup of attribute IDs to attribute names from our attributes data
  const attributeMap = new Map<string, string>()
  if (Array.isArray(enhancedAttributeValues)) {
    enhancedAttributeValues.forEach((attr: AttributeValue) => {
      if (attr.attribute_id && (attr.attribute_name || attr.attribute?.name)) {
        attributeMap.set(attr.attribute_id, attr.attribute_name || attr.attribute?.name || '')
      }
    })
  }
  
  
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.additionalAttributes.section.heading")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("products.additionalAttributes.section.edit"),
                  to: "additional-attributes",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="px-6 py-4">
        {enhancedAttributeValues.length > 0 ? (
          <div className="flex flex-col gap-2">
            {enhancedAttributeValues.map((attr: AttributeValue, index: number) => {
     
              
              // Handle various possible attribute structures, prioritizing name over ID
              // Handle all possible attribute name structures, with proper TypeScript safety
              const attributeName = attr.attribute_name || // Direct name property (from our enhanced API)
                                   attr.attribute?.name || // Nested attribute name 
                                   (attr.attribute_id ? attributeMap.get(attr.attribute_id) || null : null) || // Look up name from our attribute map with null safety
                                   (typeof attr.name === 'string' ? attr.name : null) || // Alternative structure with null safety
                                   `${t("products.additionalAttributes.section.attributeFallback")} ${index + 1}` // Last resort fallback
              
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
            {t("products.additionalAttributes.section.noAttributesAssigned")}
          </Text>
        )}
      </div>
    </Container>
  )
}
