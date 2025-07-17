import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate } from "react-router-dom"
import { RouteDrawer } from "../../../../../components/modals"
import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../../../../lib/client"
import { EditVariantAttributesForm } from "./components/edit-variant-attributes-form"
import { useInventoryItem } from "../../../../../hooks/api/inventory"

export const EditVariantAttributesDrawer = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Get the inventory item to find associated variant
  const { 
    inventory_item: inventoryItem, 
    isPending: isLoadingItem,
    isError: isInventoryError, 
    error: inventoryError 
  } = useInventoryItem(id!)
  
  // Get the first variant from the inventory item
  const firstVariant = inventoryItem && (inventoryItem as any).variants?.[0]
  const variantId = firstVariant?.id
  const productId = firstVariant?.product?.id

  // Fetch the variant details once we have the IDs
  const { 
    data: variant, 
    isLoading: isLoadingVariant, 
    isError: isVariantError, 
    error: variantError 
  } = useQuery({
    queryKey: [`variant-${productId}-${variantId}`],
    queryFn: async () => {
      if (!productId || !variantId) {
        return null
      }
      
      try {
        const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
          method: "GET",
          headers: {}
        })
        return response.variant
      } catch (error) {
        console.error("Error fetching variant:", error)
        throw error
      }
    },
    enabled: Boolean(productId && variantId)
  })
  
  const isLoading = isLoadingItem || isLoadingVariant
  const isError = isInventoryError || isVariantError
  const error = inventoryError || variantError
  const ready = !isLoading && variant && inventoryItem

  const handleClose = () => {
    navigate(-1) // Navigate back to previous route
  }

  if (isError) {
    throw error
  }
  
  if (!firstVariant) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>{t("products.variant.attributes.edit", "Edytuj atrybuty wariantu")}</Heading>
        </RouteDrawer.Header>
        <RouteDrawer.Body className="flex items-center justify-center p-8 text-ui-fg-subtle">
          {isLoading ? "Ładowanie..." : "Nie znaleziono wariantu dla tego produktu."}
        </RouteDrawer.Body>
      </RouteDrawer>
    )
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("products.variant.attributes.edit", "Edytuj atrybuty wariantu")}</Heading>
      </RouteDrawer.Header>
      
      {ready ? (
        <>
          <EditVariantAttributesForm
            productId={productId}
            variantId={variantId}
          />
          <RouteDrawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                type="button"
              >
                {t("actions.cancel", "Anuluj")}
              </Button>
              <Button 
                form="variant-attributes-form"
                type="submit"
                disabled={false}
              >
                {t("actions.save", "Zapisz")}
              </Button>
            </div>
          </RouteDrawer.Footer>
        </>
      ) : (
        <RouteDrawer.Body className="flex items-center justify-center p-8 text-ui-fg-subtle">
          {isLoading ? "Ładowanie..." : "Nie można załadować danych wariantu."}
        </RouteDrawer.Body>
      )}
    </RouteDrawer>
  )
}