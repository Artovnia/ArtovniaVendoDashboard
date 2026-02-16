import { Input, Label, Select, Text } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { DELIVERY_TIMEFRAME_PRESETS, DeliveryTimeframePresetKey } from "../../../hooks/api/delivery-timeframe"

const NONE_VALUE = "__none__"

export interface DeliveryTimeframeValue {
  preset?: DeliveryTimeframePresetKey | "custom" | null
  min_days?: number
  max_days?: number
  label?: string
  is_custom?: boolean
}

interface DeliveryTimeframeSelectProps {
  value?: DeliveryTimeframeValue
  onChange: (value: DeliveryTimeframeValue | null) => void
  disabled?: boolean
  showClearOption?: boolean
}

export const DeliveryTimeframeSelect = ({
  value,
  onChange,
  disabled = false,
  showClearOption = true,
}: DeliveryTimeframeSelectProps) => {
  const { t } = useTranslation()
  
  const getInitialPreset = () => {
    if (value?.preset && value.preset !== "custom") return value.preset
    if (value?.is_custom) return "custom"
    return NONE_VALUE
  }
  
  const [selectedPreset, setSelectedPreset] = useState<string>(getInitialPreset())
  const [customMinDays, setCustomMinDays] = useState<number>(value?.min_days || 1)
  const [customMaxDays, setCustomMaxDays] = useState<number>(value?.max_days || 7)

  useEffect(() => {
    if (value?.preset && value.preset !== "custom") {
      setSelectedPreset(value.preset)
    } else if (value?.is_custom) {
      setSelectedPreset("custom")
      setCustomMinDays(value.min_days || 1)
      setCustomMaxDays(value.max_days || 7)
    } else if (!value) {
      setSelectedPreset(NONE_VALUE)
    }
  }, [value])

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey)

    if (presetKey === NONE_VALUE) {
      onChange(null)
      return
    }

    if (presetKey === "custom") {
      onChange({
        preset: "custom",
        min_days: customMinDays,
        max_days: customMaxDays,
        label: `${customMinDays}-${customMaxDays} dni`,
        is_custom: true,
      })
    } else {
      const preset = DELIVERY_TIMEFRAME_PRESETS[presetKey as DeliveryTimeframePresetKey]
      onChange({
        preset: presetKey as DeliveryTimeframePresetKey,
        min_days: preset.min_days,
        max_days: preset.max_days,
        label: preset.label,
        is_custom: false,
      })
    }
  }

  const handleCustomMinChange = (minDays: number) => {
    setCustomMinDays(minDays)
    const maxDays = Math.max(minDays, customMaxDays)
    setCustomMaxDays(maxDays)
    
    if (selectedPreset === "custom") {
      onChange({
        preset: "custom",
        min_days: minDays,
        max_days: maxDays,
        label: `${minDays}-${maxDays} dni`,
        is_custom: true,
      })
    }
  }

  const handleCustomMaxChange = (maxDays: number) => {
    const validMaxDays = Math.max(customMinDays, maxDays)
    setCustomMaxDays(validMaxDays)
    
    if (selectedPreset === "custom") {
      onChange({
        preset: "custom",
        min_days: customMinDays,
        max_days: validMaxDays,
        label: `${customMinDays}-${validMaxDays} dni`,
        is_custom: true,
      })
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Select
        value={selectedPreset}
        onValueChange={handlePresetChange}
        disabled={disabled}
      >
        <Select.Trigger>
          <Select.Value placeholder={t("deliveryTimeframe.selectPlaceholder")} />
        </Select.Trigger>
        <Select.Content>
          {showClearOption && (
            <Select.Item value={NONE_VALUE}>
              {t("deliveryTimeframe.noTimeframe")}
            </Select.Item>
          )}
          <Select.Item value="1-3">
            {t("deliveryTimeframe.preset1to3")}
          </Select.Item>
          <Select.Item value="3-5">
            {t("deliveryTimeframe.preset3to5")}
          </Select.Item>
          <Select.Item value="7-14">
            {t("deliveryTimeframe.preset7to14")}
          </Select.Item>
          <Select.Item value="custom">
            {t("deliveryTimeframe.custom")}
          </Select.Item>
        </Select.Content>
      </Select>

      {selectedPreset === "custom" && (
        <div className="flex items-center gap-x-3 mt-2">
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("deliveryTimeframe.minDays")}</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={customMinDays}
              onChange={(e) => handleCustomMinChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-20"
            />
          </div>
          <Text className="text-ui-fg-muted mt-5">—</Text>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("deliveryTimeframe.maxDays")}</Label>
            <Input
              type="number"
              min={customMinDays}
              max={365}
              value={customMaxDays}
              onChange={(e) => handleCustomMaxChange(parseInt(e.target.value) || customMinDays)}
              disabled={disabled}
              className="w-20"
            />
          </div>
          <Text className="text-ui-fg-muted mt-5">{t("deliveryTimeframe.days")}</Text>
        </div>
      )}
    </div>
  )
}
