import { defer, LoaderFunctionArgs } from "react-router-dom"
import { fetchQuery } from "../../../lib/client"
import { PRODUCT_VARIANT_IDS_KEY } from "../common/constants"

// Define interfaces for inventory data structure
interface LocationLevel {
  id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity?: number
  incoming_quantity?: number
}

interface Inventory {
  id: string
  sku?: string | null
  title?: string
  location_levels?: LocationLevel[]
}

interface InventoryItem {
  id: string
  inventory_item_id: string
  variant_id: string
  inventory?: Inventory
}

interface StockLocation {
  id: string
  name: string
}

interface ProductVariant {
  id: string
  title: string
  sku: string | null
  inventory_quantity: number
  inventory_items?: InventoryItem[]
  prices?: any[]
  created_at: string
  updated_at: string
}

async function getProductStockData(id: string, productVariantIds?: string[]) {
  try {
    // First, fetch the product with variants included
    const productResponse = await fetchQuery(`/vendor/products/${id}`, {
      method: "GET",
      query: {
        // Request the full variant data to be included
        fields: "id,title,variants,variants.id,variants.title,variants.sku,variants.inventory_quantity,variants.prices,variants.created_at,variants.updated_at,variants.inventory_items"
      }
    })
    
    let allVariants: ProductVariant[] = []
    
    if (productResponse?.product?.variants) {
      allVariants = productResponse.product.variants
      
      // If specific variants were requested, filter to just those
      if (productVariantIds && productVariantIds.length > 0) {
        allVariants = allVariants.filter((variant: ProductVariant) => 
          productVariantIds.includes(variant.id)
        )
      }
    }
    
    // Get stock locations
    const locationsResponse = await fetchQuery(`/vendor/stock-locations`, {
      method: "GET",
      query: {
        limit: 100
      }
    })
    
    const locations = locationsResponse?.stock_locations || [] as StockLocation[]
    const defaultLocation = locations.length > 0 ? locations[0] : null
    
    // Process each variant to ensure it has inventory items and location levels
    for (const variant of allVariants) {
      if (!variant.inventory_items || variant.inventory_items.length === 0) {
        // Create a default inventory structure with the variant's inventory quantity
        variant.inventory_items = [{
          id: `default_${variant.id}`,
          inventory_item_id: `default_${variant.id}`,
          variant_id: variant.id,
          inventory: {
            id: `default_inv_${variant.id}`,
            sku: variant.sku,
            location_levels: []
          }
        }]
      }
      
      // Add default location level using variant's inventory_quantity
      if (defaultLocation && variant.inventory_items && variant.inventory_items[0]?.inventory) {
        variant.inventory_items[0].inventory.location_levels = [{
          id: `level_${variant.id}_${defaultLocation.id}`,
          location_id: defaultLocation.id,
          stocked_quantity: variant.inventory_quantity || 0,
          reserved_quantity: 0,
          incoming_quantity: 0
        }]
      }
    }

    return {
      variants: allVariants,
      locations: locations
    }
  } catch (error) {
    console.error(`Failed to fetch inventory data for product ${id}:`, error)
    return {
      variants: [] as ProductVariant[],
      locations: [] as StockLocation[]
    }
  }
}

export const productStockLoader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id || ""

  const url = new URL(request.url)
  const productVariantIds = url.searchParams.get(PRODUCT_VARIANT_IDS_KEY)
    ? url.searchParams.get(PRODUCT_VARIANT_IDS_KEY)?.split(",")
    : undefined

  return defer({
    data: getProductStockData(id, productVariantIds),
  })
}
