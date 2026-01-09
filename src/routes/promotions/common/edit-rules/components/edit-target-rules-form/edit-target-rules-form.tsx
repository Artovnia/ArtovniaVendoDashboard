import { zodResolver } from "@hookform/resolvers/zod"
import { PromotionDTO } from "@medusajs/types"
import { Button, Heading, Text } from "@medusajs/ui"
import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { RouteDrawer } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { PaginatedProductSelector } from "../../../simplified-selectors/paginated-product-selector"
import { LightweightCategorySelector } from "../../../simplified-selectors/lightweight-category-selector"

type EditTargetRulesFormProps = {
  promotion: PromotionDTO
  handleSubmit: any
  isSubmitting: boolean
}

const EditTargetRulesSchema = zod.object({
  productIds: zod.array(zod.string()).optional(),
  categoryIds: zod.array(zod.string()).optional(),
})

type EditTargetRulesType = zod.infer<typeof EditTargetRulesSchema>

export const EditTargetRulesForm = ({
  promotion,
  handleSubmit,
  isSubmitting,
}: EditTargetRulesFormProps) => {
  const { t } = useTranslation()

  // Extract existing product and category IDs from target rules
  const { initialProductIds, initialCategoryIds } = useMemo(() => {
    const targetRules = promotion.application_method?.target_rules || []
    
    const productRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.id'
    )
    const categoryRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.categories.id'
    )

    const extractIds = (values: any[] | undefined): string[] => {
      if (!values) return []
      return values.map(v => typeof v === 'string' ? v : v.value)
    }

    return {
      initialProductIds: extractIds(productRule?.values),
      initialCategoryIds: extractIds(categoryRule?.values),
    }
  }, [promotion])

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialProductIds)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds)

  const form = useForm<EditTargetRulesType>({
    defaultValues: {
      productIds: initialProductIds,
      categoryIds: initialCategoryIds,
    },
    resolver: zodResolver(EditTargetRulesSchema),
  })

  const handleFormSubmit = form.handleSubmit(async () => {
    await handleSubmit({
      productIds: selectedProductIds,
      categoryIds: selectedCategoryIds,
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleFormSubmit}
        className="flex h-full flex-col"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-8">
          <div className="flex flex-col gap-y-4">
            <div>
              <Heading level="h2" className="mb-2">
                {t('promotions.fields.conditions.target-rules.title')}
              </Heading>
              <Text className="text-ui-fg-subtle txt-small">
                {t('promotions.fields.conditions.target-rules.description')}
              </Text>
            </div>

            <div className="flex flex-col gap-y-6">
              {/* Product Selector */}
              <div className="flex flex-col gap-y-3">
                <div>
                  <Text size="small" weight="plus" className="mb-1">
                    {t("promotions.fields.products")}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Select products this promotion applies to
                  </Text>
                </div>
                <PaginatedProductSelector
                  selectedProductIds={selectedProductIds}
                  onChange={setSelectedProductIds}
                />
              </div>

              {/* Category Selector */}
              <div className="flex flex-col gap-y-3">
                <div>
                  <Text size="small" weight="plus" className="mb-1">
                    {t("promotions.fields.categories")}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Select categories this promotion applies to
                  </Text>
                </div>
                <LightweightCategorySelector
                  selectedCategoryIds={selectedCategoryIds}
                  onChange={setSelectedCategoryIds}
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" disabled={isSubmitting}>
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button size="small" type="submit" isLoading={isSubmitting}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
