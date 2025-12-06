// C:\repo\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-pricing\components\create-shipping-options-form\edit-shipping-options-pricing-form.tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "../../../../../components/modals/index"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { usePricePreferences } from "../../../../../hooks/api/price-preferences"
import { useRegions } from "../../../../../hooks/api/regions"
import { useUpdateShippingOptions } from "../../../../../hooks/api/shipping-options"
import { useStore } from "../../../../../hooks/api/store"
import { castNumber } from "../../../../../lib/cast-number"
import { ConditionalPriceForm } from "../../../common/components/conditional-price-form"
import { ShippingOptionPriceProvider } from "../../../common/components/shipping-option-price-provider"
import {
  CONDITIONAL_PRICES_STACKED_MODAL_ID,
  ITEM_TOTAL_ATTRIBUTE,
  REGION_ID_ATTRIBUTE,
} from "../../../common/constants"
import { useShippingOptionPriceColumns } from "../../../common/hooks/use-shipping-option-price-columns"
import {
  UpdateConditionalPrice,
  UpdateConditionalPriceSchema,
} from "../../../common/schema"
import { ConditionalPriceInfo } from "../../../common/types"

type SimplePriceRecord = {
  currency_code: string
  amount: number
}

const EditShippingOptionPricingSchema = zod.object({
  region_prices: zod.record(
    zod.string(),
    zod.string().or(zod.number()).optional()
  ),
  currency_prices: zod.record(
    zod.string(),
    zod.string().or(zod.number()).optional()
  ),
  conditional_region_prices: zod.record(
    zod.string(),
    zod.array(UpdateConditionalPriceSchema)
  ),
  conditional_currency_prices: zod.record(
    zod.string(),
    zod.array(UpdateConditionalPriceSchema)
  ),
})

type EditShippingOptionPricingFormProps = {
  shippingOption: HttpTypes.AdminShippingOption
}

export function EditShippingOptionsPricingForm({
  shippingOption,
}: EditShippingOptionPricingFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { getIsOpen, setIsOpen } = useStackedModal()
  const [selectedPrice, setSelectedPrice] =
    useState<ConditionalPriceInfo | null>(null)

  const onOpenConditionalPricesModal = (info: ConditionalPriceInfo) => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, true)
    setSelectedPrice(info)
  }

  const onCloseConditionalPricesModal = () => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, false)
    setSelectedPrice(null)
  }

  const form = useForm<zod.infer<typeof EditShippingOptionPricingSchema>>({
    defaultValues: getDefaultValues(shippingOption.prices || []),
    resolver: zodResolver(EditShippingOptionPricingSchema),
  })

  // Reset form when shippingOption prices change (fixes race condition)
  useEffect(() => {
    if (shippingOption?.prices) {
      const defaultValues = getDefaultValues(shippingOption.prices)
      form.reset(defaultValues)
    }
  }, [shippingOption?.prices, form])

  const { mutateAsync, isPending } = useUpdateShippingOptions(shippingOption.id)

  const {
    store,
    isLoading: isStoreLoading,
    isError: isStoreError,
    error: storeError,
  } = useStore()

  const currencies = useMemo(
    () => store?.supported_currencies?.map((c) => c.currency_code) || [],
    [store]
  )

  const {
    regions,
    isLoading: isRegionsLoading,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({
    fields: "id,name,currency_code",
    limit: 999,
  })

  const { price_preferences: pricePreferences } = usePricePreferences({})

  const { setCloseOnEscape } = useRouteModal()

  const columns = useShippingOptionPriceColumns({
    name: shippingOption.name,
    currencies,
    regions,
    pricePreferences,
  })

  const data = useMemo(
    () => [[...(currencies || []), ...(regions || [])]],
    [currencies, regions]
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const allPrices: SimplePriceRecord[] = []
      
      // Process currency prices - only basic currency pricing for now
      Object.entries(data.currency_prices).forEach(([code, value]) => {
        if (
          value &&
          currencies.some((c) => c.toLowerCase() === code.toLowerCase())
        ) {
          allPrices.push({
            currency_code: code,
            amount: castNumber(value),
          })
        }
      })

      // Send ONLY the prices - do not include rules at all
      // This will preserve existing rules completely
      await mutateAsync(
        { 
          prices: allPrices
          // Intentionally NOT including rules or any rule-related fields
        },
        {
          onSuccess: () => {
            toast.success(t("general.success"))
            handleSuccess()
          },
          onError: (error) => {
            console.error("Price update failed:", error)
            
            let errorMessage = "Failed to update shipping option prices"
            if (error && typeof error === 'object' && 'message' in error) {
              errorMessage = (error as any).message
            } else if (error && typeof error === 'string') {
              errorMessage = error
            }
            
            toast.error(errorMessage)
          },
        }
      )
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  })

  const isLoading =
    isStoreLoading || isRegionsLoading || !currencies || !regions

  if (isStoreError) {
    throw storeError
  }

  if (isRegionsError) {
    throw regionsError
  }

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body>
          <StackedFocusModal
            id={CONDITIONAL_PRICES_STACKED_MODAL_ID}
            onOpenChangeCallback={(open) => {
              if (!open) {
                setSelectedPrice(null)
              }
            }}
          >
            <ShippingOptionPriceProvider
              onOpenConditionalPricesModal={onOpenConditionalPricesModal}
              onCloseConditionalPricesModal={onCloseConditionalPricesModal}
            >
              <div className="flex size-full flex-col divide-y overflow-hidden">
                <DataGrid
                  isLoading={isLoading}
                  data={data}
                  columns={columns}
                  state={form}
                  onEditingChange={(editing) => setCloseOnEscape(!editing)}
                  disableInteractions={getIsOpen(
                    CONDITIONAL_PRICES_STACKED_MODAL_ID
                  )}
                />
              </div>
              {selectedPrice && (
                <ConditionalPriceForm info={selectedPrice} variant="update" />
              )}
            </ShippingOptionPriceProvider>
          </StackedFocusModal>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              className="whitespace-nowrap"
              isLoading={isPending}
              onClick={handleSubmit}
              type="button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

// Simplified helper functions
const getDefaultValues = (prices: HttpTypes.AdminShippingOptionPrice[]) => {
  const currency_prices: Record<string, number> = {}
  const conditional_currency_prices: Record<string, UpdateConditionalPrice[]> = {}
  const region_prices: Record<string, number> = {}
  const conditional_region_prices: Record<string, UpdateConditionalPrice[]> = {}

  if (!prices || !Array.isArray(prices)) {
    return {
      currency_prices,
      conditional_currency_prices,
      region_prices,
      conditional_region_prices,
    }
  }

  prices.forEach((price) => {
    // For now, only handle simple currency prices
    if (!price.price_rules?.length && price.currency_code) {
      currency_prices[price.currency_code] = price.amount
    }
  })

  return {
    currency_prices,
    conditional_currency_prices,
    region_prices,
    conditional_region_prices,
  }
}