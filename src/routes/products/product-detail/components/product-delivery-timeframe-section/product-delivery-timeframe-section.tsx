import { PencilSquare, Trash, TruckFast } from "@medusajs/icons"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { 
  useProductDeliveryTimeframe, 
  useSetProductDeliveryTimeframe,
  useDeleteProductDeliveryTimeframe,
  DeliveryTimeframePresetKey,
} from "../../../../../hooks/api/delivery-timeframe"
import { DeliveryTimeframeEditModal } from "./delivery-timeframe-edit-modal"

type ProductDeliveryTimeframeSectionProps = {
  productId: string
}

export const ProductDeliveryTimeframeSection = ({
  productId,
}: ProductDeliveryTimeframeSectionProps) => {
  const { t } = useTranslation()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const { deliveryTimeframe, isLoading, refetch } = useProductDeliveryTimeframe(productId)
  const { mutateAsync: setTimeframe, isPending: isUpdating } = useSetProductDeliveryTimeframe(productId)
  const { mutateAsync: deleteTimeframe, isPending: isDeleting } = useDeleteProductDeliveryTimeframe(productId)

  const handleSave = async (data: {
    preset?: DeliveryTimeframePresetKey | "custom"
    min_days?: number
    max_days?: number
    label?: string
  }) => {
    try {
      if (data.preset && data.preset !== "custom") {
        await setTimeframe({ preset: data.preset as DeliveryTimeframePresetKey })
      } else {
        await setTimeframe({
          min_days: data.min_days,
          max_days: data.max_days,
          label: data.label,
          is_custom: true,
        })
      }
      toast.success(t("deliveryTimeframe.updated"))
      refetch()
      setIsEditModalOpen(false)
    } catch (error) {
      toast.error(t("deliveryTimeframe.updateError"))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTimeframe()
      toast.success(t("deliveryTimeframe.removed"))
      refetch()
    } catch (error) {
      toast.error(t("deliveryTimeframe.removeError"))
    }
  }

  const getDisplayLabel = () => {
    if (!deliveryTimeframe) return null
    
    if (deliveryTimeframe.label) {
      return deliveryTimeframe.label
    }
    
    return `${deliveryTimeframe.min_days}-${deliveryTimeframe.max_days} ${t("deliveryTimeframe.days")}`
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-3">
            <TruckFast className="text-ui-fg-subtle" />
            <Heading level="h2">{t("deliveryTimeframe.title")}</Heading>
          </div>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    onClick: () => setIsEditModalOpen(true),
                  },
                ],
              },
              ...(deliveryTimeframe
                ? [
                    {
                      actions: [
                        {
                          label: t("actions.delete"),
                          icon: <Trash />,
                          onClick: handleDelete,
                          disabled: isDeleting,
                        },
                      ],
                    },
                  ]
                : []),
            ]}
          />
        </div>
        <div className="px-6 py-4">
          {isLoading ? (
            <Text className="text-ui-fg-muted">{t("general.loading")}</Text>
          ) : deliveryTimeframe ? (
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <Text className="text-ui-fg-subtle">{t("deliveryTimeframe.currentTimeframe")}</Text>
                <Text className="font-medium">{getDisplayLabel()}</Text>
              </div>
              {deliveryTimeframe.is_custom && (
                <Text size="small" className="text-ui-fg-muted">
                  {t("deliveryTimeframe.customTimeframe")}
                </Text>
              )}
            </div>
          ) : (
            <Text className="text-ui-fg-muted">{t("deliveryTimeframe.notSet")}</Text>
          )}
        </div>
      </Container>

      <DeliveryTimeframeEditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        isLoading={isUpdating}
        currentTimeframe={deliveryTimeframe}
      />
    </>
  )
}
