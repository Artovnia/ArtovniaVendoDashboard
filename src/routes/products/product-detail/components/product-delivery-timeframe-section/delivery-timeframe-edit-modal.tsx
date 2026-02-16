import { Button, Drawer } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { DeliveryTimeframeSelect, DeliveryTimeframeValue } from "../../../../../components/inputs/delivery-timeframe-select"
import { DeliveryTimeframe, DeliveryTimeframePresetKey } from "../../../../../hooks/api/delivery-timeframe"

type DeliveryTimeframeEditModalProps = {
  open: boolean
  onClose: () => void
  onSave: (data: {
    preset?: DeliveryTimeframePresetKey | "custom"
    min_days?: number
    max_days?: number
    label?: string
  }) => void
  isLoading: boolean
  currentTimeframe: DeliveryTimeframe | null | undefined
}

export const DeliveryTimeframeEditModal = ({
  open,
  onClose,
  onSave,
  isLoading,
  currentTimeframe,
}: DeliveryTimeframeEditModalProps) => {
  const { t } = useTranslation()
  
  const [value, setValue] = useState<DeliveryTimeframeValue | null>(null)

  useEffect(() => {
    if (currentTimeframe) {
      // Determine if it matches a preset
      let preset: DeliveryTimeframePresetKey | "custom" | undefined
      
      if (!currentTimeframe.is_custom) {
        if (currentTimeframe.min_days === 1 && currentTimeframe.max_days === 3) {
          preset = "1-3"
        } else if (currentTimeframe.min_days === 3 && currentTimeframe.max_days === 5) {
          preset = "3-5"
        } else if (currentTimeframe.min_days === 7 && currentTimeframe.max_days === 14) {
          preset = "7-14"
        } else {
          preset = "custom"
        }
      } else {
        preset = "custom"
      }

      setValue({
        preset,
        min_days: currentTimeframe.min_days,
        max_days: currentTimeframe.max_days,
        label: currentTimeframe.label || undefined,
        is_custom: currentTimeframe.is_custom,
      })
    } else {
      setValue(null)
    }
  }, [currentTimeframe, open])

  const handleSave = () => {
    if (!value) {
      onClose()
      return
    }

    onSave({
      preset: value.preset as DeliveryTimeframePresetKey | "custom",
      min_days: value.min_days,
      max_days: value.max_days,
      label: value.label,
    })
  }

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{t("deliveryTimeframe.editTitle")}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 p-6">
          <DeliveryTimeframeSelect
            value={value || undefined}
            onChange={(newValue) => setValue(newValue)}
            showClearOption={true}
          />
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleSave} isLoading={isLoading}>
              {t("actions.save")}
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
