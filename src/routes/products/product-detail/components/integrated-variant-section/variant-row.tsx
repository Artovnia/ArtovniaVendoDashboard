import { EllipsisHorizontal, PencilSquare, Trash, Buildings, ChevronDownMini, ChevronUpMini } from '@medusajs/icons'
import { IconButton, Text, usePrompt, DropdownMenu } from '@medusajs/ui'
import { HttpTypes } from '@medusajs/types'
import { AdminProductVariant } from "@medusajs/types"
import { useState, useEffect } from 'react'
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from 'react-router-dom'
import { useDeleteVariantLazy } from '../../../../../hooks/api'
import { fetchQuery } from '../../../../../lib/client'
import { VariantColorSection } from '../variant-color-section'
import { inventoryItemLoader } from '../../../../../routes/inventory/inventory-detail/loader';

interface ExtendedVariant extends AdminProductVariant {
  available_quantity?: number;
  stocked_quantity?: number;
  reserved_quantity?: number;
}

type VariantRowProps = {
  variant: ExtendedVariant
  productId: string
}

export const VariantRow = ({ variant, productId }: VariantRowProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync: deleteVariant } = useDeleteVariantLazy(productId)
  const [availableQuantity, setAvailableQuantity] = useState<number>(variant.inventory_quantity || 0)
  const [isLoadingInventory, setIsLoadingInventory] = useState<boolean>(false)

  // Format price correctly without dividing by 100 (it's already in the correct decimal format)
  const formatPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) {
      return "-"
    }
    
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
    }).format(amount)
  }
  
  // Handle when delete button is clicked
  const handleDelete = async () => {
    const shouldDelete = await prompt({
      title: "Usuń wariant",
      description: `Czy na pewno chcesz usunąć wariant ${variant.title}?`,
      confirmText: "Tak, usuń",
      cancelText: "Anuluj",
    })
    
    if (shouldDelete) {
      try {
        await deleteVariant({
          variantId: variant.id,
        })
      } catch (error) {
        console.error("Error deleting variant:", error)
      }
    }
  }

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setIsLoadingInventory(true)
        
        // First try to use pre-calculated available_quantity from the loader
        if (variant.available_quantity !== undefined) {
          setAvailableQuantity(variant.available_quantity)
          return
        }
        
        // Get the inventory item ID if available
        const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
        
        if (inventoryItemId) {
          // Fetch inventory levels with explicit fields
          const levelsResponse = await fetchQuery(`/vendor/inventory-items/${inventoryItemId}/location-levels`, {
            method: "GET",
            query: {
              fields: "id,stocked_quantity,reserved_quantity,available_quantity"
            }
          })
          
          // Check if we have location levels
          const locationLevels = levelsResponse?.location_levels || levelsResponse?.inventory_item_levels
          
          if (locationLevels?.length > 0) {
            // Calculate total stocked and reserved across all locations
            let totalStocked = 0
            let totalReserved = 0
            
            locationLevels.forEach((level) => {
              totalStocked += Number(level.stocked_quantity || 0)
              totalReserved += Number(level.reserved_quantity || 0)
            })
            
            // Available quantity = stocked - reserved
            const availableQty = Math.max(0, totalStocked - totalReserved)
            setAvailableQuantity(availableQty)
            return
          }
          
          // Try batch API as another option
          try {
            const batchResponse = await fetchQuery('/vendor/inventory-items', {
              method: "GET",
              query: {
                inventory_item_id: inventoryItemId,
                fields: "id,stocked_quantity,reserved_quantity"
              }
            })
            
            if (batchResponse?.inventory_items?.length > 0) {
              const item = batchResponse.inventory_items[0]
              if (item.stocked_quantity !== undefined) {
                const stocked = Number(item.stocked_quantity || 0)
                const reserved = Number(item.reserved_quantity || 0)
                const available = Math.max(0, stocked - reserved)
                
                setAvailableQuantity(available)
                return
              }
            }
          } catch (batchError) {
            // Silent fail and continue to fallback
          }
        }
        
        // Fallback to inventory_quantity as a last resort
        setAvailableQuantity(variant.inventory_quantity || 0)
      } catch (error) {
        // Fallback to inventory quantity on error
        setAvailableQuantity(variant.inventory_quantity || 0)
      } finally {
        setIsLoadingInventory(false)
      }
    }
    
    fetchInventoryData()
  }, [variant.id, variant.inventory_items, variant.available_quantity])
  
  // Get inventory item ID for inventory link
  const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id

  return (
    <div className="border-b border-ui-border-base last:border-b-0">
      {/* Variant information row */}
      <div className="px-6 py-4">
        <div className="flex items-center">
          {/* Variant title column */}
          <div className="flex-1">
            <div className="flex items-center gap-x-2">
              <Text className="font-medium">{variant.title}</Text>
              {variant.sku && (
                <Text className="text-ui-fg-subtle text-sm">
                  SKU: {variant.sku}
                </Text>
              )}
            </div>
          </div>
          
          {/* Price column - width matching header */}
          <div className="w-20 text-right">
            <Text>
              {variant.prices && variant.prices.length > 0 ? (
                formatPrice(variant.prices[0]?.amount)
              ) : (
                '-'
              )}
            </Text>
          </div>
          
          {/* Inventory column - width matching header */}
          <div className="w-20 text-right">
            <div className="font-medium">
              {isLoadingInventory ? (
                <span className="text-ui-fg-subtle">...</span>
              ) : availableQuantity === undefined ? (
                <span className="text-ui-fg-subtle">ERROR</span>
              ) : availableQuantity > 10 ? (
                <span className="text-emerald-600">{availableQuantity}</span>
              ) : availableQuantity > 0 ? (
                <span className="text-amber-500">{availableQuantity}</span>
              ) : (
                <span className="text-rose-500">{availableQuantity || 'N/A'}</span>
              )}
            </div>
          </div>
          
          {/* Actions column - width matching header */}
          <div className="w-24 flex justify-end items-center gap-2">
            {/* Expand/collapse button */}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              variant="transparent"
              size="small"
            >
              {expanded ? <ChevronUpMini /> : <ChevronDownMini />}
            </IconButton>

            {/* Context menu for actions */}
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton variant="transparent" size="small">
                  <EllipsisHorizontal />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {/* Edit variant */}
                <DropdownMenu.Item asChild>
                  <Link to={`/products/${productId}/edit-variant?variant_id=${variant.id}`}>
                    <div className="flex items-center">
                      <PencilSquare className="w-4 h-4" />
                      <span className="ml-2">{t('actions.edit', 'Edytuj wariant')}</span>
                    </div>
                  </Link>
                </DropdownMenu.Item>
                
                {/* Edit prices */}
                <DropdownMenu.Item asChild>
                  <Link to={`/products/${productId}/prices?variant_id=${variant.id}`}>
                    <div className="flex items-center">
                      <PencilSquare className="w-4 h-4" />
                      <span className="ml-2">{t('products.editPrices', 'Edytuj ceny')}</span>
                    </div>
                  </Link>
                </DropdownMenu.Item>
                

                {/* Go to inventory item */}
                {inventoryItemId && (
                  <DropdownMenu.Item asChild>
                    <Link to={`/inventory/${inventoryItemId}`}>
                      <div className="flex items-center">
                        <Buildings className="w-4 h-4" />
                        <span className="ml-2">{t('products.variant.goToInventory', 'Przejdź do magazynu')}</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>
                )}
                
                {/* Delete variant */}
                <DropdownMenu.Item 
                  onClick={handleDelete}
                  className="text-ui-fg-error"
                >
                  <div className="flex items-center">
                    <Trash className="w-4 h-4" />
                    <span className="ml-2">{t('actions.delete', 'Usuń')}</span>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      {expanded && (
        <div className="border-t border-ui-border-base bg-ui-bg-subtle">
          <VariantColorSection 
            productId={productId}
            variantId={variant.id}
            variantTitle={variant.title || ''}
          />
        </div>
      )}
    </div>
  )
}

export default VariantRow
