import { PromotionDTO } from "@medusajs/types"
import { useRouteModal } from "../../../../../../components/modals"
import { usePromotionUpdateRules } from "../../../../../../hooks/api/promotions"
import { EditTargetRulesForm } from "../edit-target-rules-form"

type EditTargetRulesWrapperProps = {
  promotion: PromotionDTO
}

export const EditTargetRulesWrapper = ({
  promotion,
}: EditTargetRulesWrapperProps) => {
  const { handleSuccess } = useRouteModal()
  const { mutateAsync: updateRules, isPending } = usePromotionUpdateRules(
    promotion.id,
    'target-rules'
  )

  const handleSubmit = async (data: {
    productIds: string[]
    categoryIds: string[]
  }) => {
    const targetRules: any[] = []

    // Add product rule if products are selected
    if (data.productIds && data.productIds.length > 0) {
      targetRules.push({
        attribute: 'items.product.id',
        operator: 'in',
        values: data.productIds,
      })
    }

    // Add category rule if categories are selected
    if (data.categoryIds && data.categoryIds.length > 0) {
      targetRules.push({
        attribute: 'items.product.categories.id',
        operator: 'in',
        values: data.categoryIds,
      })
    }

    // Use the rules batch API endpoint instead of updating promotion directly
    await updateRules({
      rules: targetRules,
    })

    handleSuccess()
  }

  return (
    <EditTargetRulesForm
      promotion={promotion}
      handleSubmit={handleSubmit}
      isSubmitting={isPending}
    />
  )
}
