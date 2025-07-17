import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { DefaultValues, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { fetchQuery } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { castNumber } from "../../../../../lib/cast-number"
import { useProductStockColumns } from "../../hooks/use-product-stock-columns"
import {
  ProductStockInventoryItemSchema,
  ProductStockLocationSchema,
  ProductStockSchema,
  ProductStockVariantSchema,
} from "../../schema"
import {
  getDisabledInventoryRows,
  isProductVariantWithInventoryPivot,
} from "../../utils"

type ProductStockFormProps = {
  variants: HttpTypes.AdminProductVariant[]
  locations: HttpTypes.AdminStockLocation[]
  onLoaded: () => void
}

export const ProductStockForm = ({
  variants,
  locations,
  onLoaded,
}: ProductStockFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const prompt = usePrompt()
  
  // Call onLoaded only once when component mounts
  useEffect(() => {
    // Don't log the variants/locations to avoid triggering rerenders
    onLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Generate default values once on component mount
  const formDefaultValues = useMemo(() => {
    try {
      return getDefaultValue(variants, locations)
    } catch (error) {
      console.error('Error generating form values:', error)
      setFormError(`Error generating form values: ${error instanceof Error ? error.message : String(error)}`)
      return {} as DefaultValues<ProductStockSchema> // Empty default to prevent crashes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures this runs only once on mount

  // Use direct object for defaultValues to avoid Promise expectations
  const form = useForm<ProductStockSchema>({
    defaultValues: formDefaultValues,
    resolver: zodResolver(ProductStockSchema),
  })

  // Keep a reference to the initial values for comparison on submit
  const initialValues = useRef(formDefaultValues)

  const disabled = useMemo(() => getDisabledInventoryRows(variants), [variants])
  const columns = useProductStockColumns(locations, disabled)
  
  // Track loading state for our custom mutation
  const [isPending, setIsPending] = useState(false)

  const onSubmit = form.handleSubmit(async (data) => {
    const payload: HttpTypes.AdminBatchInventoryItemsLocationLevels = {
      create: [],
      update: [],
      delete: [],
      force: true,
    }

    for (const [variantId, variant] of Object.entries(data.variants)) {
      for (const [inventory_item_id, item] of Object.entries(
        variant.inventory_items
      )) {
        for (const [location_id, level] of Object.entries(item.locations)) {
          if (level.id) {
            const wasChecked =
              initialValues.current?.variants?.[variantId]?.inventory_items?.[
                inventory_item_id
              ]?.locations?.[location_id]?.checked

            if (wasChecked && !level.checked) {
              payload.delete.push(level.id)
            } else {
              const newQuantity =
                level.quantity !== "" ? castNumber(level.quantity) : 0
              const originalQuantity =
                initialValues.current?.variants?.[variantId]?.inventory_items?.[
                  inventory_item_id
                ]?.locations?.[location_id]?.quantity

              if (newQuantity !== originalQuantity) {
                payload.update.push({
                  inventory_item_id,
                  location_id,
                  stocked_quantity: newQuantity,
                })
              }
            }
          }

          if (!level.id && level.quantity !== "") {
            payload.create.push({
              inventory_item_id,
              location_id,
              stocked_quantity: castNumber(level.quantity),
            })
          }
        }
      }
    }

    if (payload.delete.length > 0) {
      setIsPromptOpen(true)
      const confirm = await prompt({
        title: t("general.areYouSure"),
        description: t("inventory.stock.disablePrompt", {
          count: payload.delete.length,
        }),
        confirmText: t("actions.continue"),
        cancelText: t("actions.cancel"),
        variant: "confirmation",
      })

      setIsPromptOpen(false)

      if (!confirm) {
        return
      }
    }

    // Use vendor API endpoints instead of admin endpoints
    try {
      setIsPending(true)
      
      // For each variant, update its inventory quantity instead of using the batch endpoint
      // This uses the vendor-accessible product update endpoint
      const updatePromises = []
      
      for (const [variantId, variant] of Object.entries(data.variants)) {
        // Calculate total inventory quantity across all locations for this variant
        let totalInventory = 0
        
        for (const [_, item] of Object.entries(variant.inventory_items)) {
          for (const [_, level] of Object.entries(item.locations)) {
            // Only count checked locations with quantities
            if (level.checked && level.quantity !== "") {
              totalInventory += castNumber(level.quantity)
            }
          }
        }
        
        // Update the variant's inventory through the vendor product variant endpoint
        updatePromises.push(
          fetchQuery(`/vendor/products/variants/${variantId}`, {
            method: "POST",
            body: {
              inventory_quantity: totalInventory
            }
          })
        )
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises)
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] })
      
      toast.success(t("inventory.stock.successToast"))
      handleSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while updating inventory")
    } finally {
      setIsPending(false)
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={onSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex-1">
          {/* Show any form generation errors */}
          {formError && (
            <div className="p-4 mb-4 text-sm text-rose-500 bg-rose-50 rounded-md">
              {formError}
            </div>
          )}
          
          {/* Show data missing warning */}
          {(!variants || variants.length === 0 || !locations || locations.length === 0) && (
            <div className="p-4 mb-4 text-sm text-amber-500 bg-amber-50 rounded-md">
              {t('inventory.stock.missingData', 'Brakujące dane wariantów lub lokalizacji magazynowych.')}
            </div>
          )}
          
          <DataGrid
            state={form}
            columns={columns}
            data={variants || []}
            getSubRows={getSubRows}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
            disableInteractions={isPending || isPromptOpen}
            multiColumnSelection={true}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function getSubRows(
  row:
    | HttpTypes.AdminProductVariant
    | HttpTypes.AdminProductVariantInventoryItemLink
): HttpTypes.AdminProductVariantInventoryItemLink[] | undefined {
  if (isProductVariantWithInventoryPivot(row)) {
    return row.inventory_items
  }
}

function getDefaultValue(
  variants: HttpTypes.AdminProductVariant[],
  locations: HttpTypes.AdminStockLocation[]
): DefaultValues<ProductStockSchema> {
  return {
    variants: variants.reduce((variantAcc, variant) => {
      const inventoryItems = variant.inventory_items?.reduce(
        (itemAcc, item) => {
          const locationsMap = locations.reduce((locationAcc, location) => {
            const level = item.inventory?.location_levels?.find(
              (level) => level.location_id === location.id
            )

            locationAcc[location.id] = {
              id: level?.id,
              quantity:
                level?.stocked_quantity !== undefined
                  ? level?.stocked_quantity
                  : "",
              checked: !!level,
              disabledToggle:
                (level?.incoming_quantity || 0) > 0 ||
                (level?.reserved_quantity || 0) > 0,
            }
            return locationAcc
          }, {} as ProductStockLocationSchema)

          itemAcc[item.inventory_item_id] = { locations: locationsMap }
          return itemAcc
        },
        {} as Record<string, ProductStockInventoryItemSchema>
      )

      variantAcc[variant.id] = { inventory_items: inventoryItems || {} }
      return variantAcc
    }, {} as Record<string, ProductStockVariantSchema>),
  }
}
