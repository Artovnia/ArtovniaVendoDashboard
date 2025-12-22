import { Checkbox, Text } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { translateShippingProfileKey } from "../../../../../lib/shipping-profile-i18n"

interface ParcelItem {
  item_id: string
  quantity: number
  product_name: string
  variant_title?: string
  thumbnail?: string
  capacity_per_unit: number
  total_capacity: number
  profile_name: string
}

interface Parcel {
  parcel_number: number
  shipping_method_id: string
  shipping_option_id: string
  shipping_option_name: string
  shipping_profile: {
    id: string
    name: string
    capacity: number
    capacity_unit: string
  }
  items: ParcelItem[]
  total_capacity: number
  min_required_capacity: number
  fits_in_method: boolean
}

interface ParcelSelectorProps {
  parcels: Parcel[]
  selectedParcels: number[]
  onParcelToggle: (parcelNumber: number) => void
  currencyCode: string
}

export function ParcelSelector({
  parcels,
  selectedParcels,
  onParcelToggle,
  currencyCode,
}: ParcelSelectorProps) {
  const { t } = useTranslation()
  const [expandedParcels, setExpandedParcels] = useState<Set<number>>(
    new Set([1]) // Expand first parcel by default
  )

  const toggleExpanded = (parcelNumber: number) => {
    const newExpanded = new Set(expandedParcels)
    if (newExpanded.has(parcelNumber)) {
      newExpanded.delete(parcelNumber)
    } else {
      newExpanded.add(parcelNumber)
    }
    setExpandedParcels(newExpanded)
  }

  if (parcels.length === 0) {
    return (
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
        <Text className="text-ui-fg-subtle">
          {t("parcelSelector.noItems")}
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Text className="text-ui-fg-base font-medium">
          {t("parcelSelector.title").replace("{count}", String(parcels.length))}
        </Text>
        {parcels.length > 1 && (
          <Text className="text-ui-fg-subtle text-xs">
            {t("parcelSelector.selectHint")}
          </Text>
        )}
      </div>

      {parcels.map((parcel) => {
        const isSelected = selectedParcels.includes(parcel.parcel_number)
        const isExpanded = expandedParcels.has(parcel.parcel_number)
        const totalItems = parcel.items.reduce((sum, item) => sum + item.quantity, 0)

        return (
          <div
            key={parcel.parcel_number}
            className={`rounded-lg border transition-colors ${
              isSelected
                ? "border-ui-border-interactive bg-ui-bg-base"
                : "border-ui-border-base bg-ui-bg-subtle"
            }`}
          >
            {/* Parcel Header */}
            <div className="flex items-center gap-3 p-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onParcelToggle(parcel.parcel_number)}
                id={`parcel-${parcel.parcel_number}`}
              />
              
              <div
                className="flex flex-1 cursor-pointer flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => toggleExpanded(parcel.parcel_number)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Text className="font-medium">
                      {t("parcelSelector.parcelNumber").replace("{number}", String(parcel.parcel_number))}
                    </Text>
                    <span className="rounded-full bg-ui-bg-base px-2 py-0.5 text-xs text-ui-fg-subtle">
                      {totalItems} {totalItems === 1 ? t("parcelSelector.item") : t("parcelSelector.items")}
                    </span>
                  </div>
                  <Text className="text-ui-fg-subtle text-xs">
                    {parcel.shipping_option_name}
                  </Text>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <Text className="text-xs text-ui-fg-subtle">
                      {t("parcelSelector.capacity").replace("{current}", String(parcel.total_capacity)).replace("{max}", String(parcel.shipping_profile.capacity))}
                    </Text>
                    {!parcel.fits_in_method && (
                      <Text className="text-xs text-ui-fg-error">
                        {t("parcelSelector.exceedsCapacity")}
                      </Text>
                    )}
                  </div>
                  
                  <svg
                    className={`h-5 w-5 text-ui-fg-subtle transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Parcel Items (Expanded) */}
            {isExpanded && (
              <div className="border-t border-ui-border-base bg-ui-bg-base px-4 py-3">
                <div className="flex flex-col gap-2">
                  {parcel.items.map((item) => (
                    <div
                      key={`${item.item_id}-${item.quantity}`}
                      className="flex flex-col gap-2 rounded-md bg-ui-bg-subtle p-2 sm:flex-row sm:items-center"
                    >
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.product_name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      
                      <div className="flex flex-1 flex-col">
                        <Text className="text-sm font-medium">
                          {item.product_name}
                        </Text>
                        {item.variant_title && (
                          <Text className="text-xs text-ui-fg-subtle">
                            {item.variant_title}
                          </Text>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-left sm:text-right">
                        <div>
                          <Text className="text-xs text-ui-fg-subtle">
                            {t("parcelSelector.quantity")}
                          </Text>
                          <Text className="text-sm font-medium">
                            {item.quantity}
                          </Text>
                        </div>
                        
                        <div>
                          <Text className="text-xs text-ui-fg-subtle">
                            {t("parcelSelector.capacity").split(":")[0]}
                          </Text>
                          <Text className="text-sm font-medium">
                            {item.total_capacity}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-ui-border-base pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <Text className="text-xs text-ui-fg-subtle">
                    {t("parcelSelector.shippingProfile").replace("{name}", translateShippingProfileKey(parcel.shipping_profile.name, false, t))}
                  </Text>
                  <Text className="text-xs font-medium">
                    {t("parcelSelector.totalCapacity").replace("{capacity}", String(parcel.total_capacity)).replace("{unit}", parcel.shipping_profile.capacity_unit)}
                  </Text>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {selectedParcels.length === 0 && (
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
          <Text className="text-center text-sm text-ui-fg-subtle">
            {t("parcelSelector.selectAtLeastOne")}
          </Text>
        </div>
      )}
    </div>
  )
}
