import { useParams, useSearchParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { usePriceList } from "../../../hooks/api/price-lists"
import { useProducts } from "../../../hooks/api/products"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"
import { PriceListPricesEditForm } from "./components/price-list-prices-edit-form"
import { useEffect, useState, useMemo, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { fetchQuery } from "../../../lib/client"

/**
 * Enhances products with price list prices by associating the prices with their respective variants
 * using price_set_id as the linking mechanism
 */
function enhanceProductsWithPriceListPrices(
  products: HttpTypes.AdminProduct[],
  priceList: HttpTypes.AdminPriceList
): HttpTypes.AdminProduct[] {
  if (!products || !priceList?.prices || !priceList.prices.length) {
    return products
  }

  // First, create a map of price_set_id to prices
  const priceSetMap = new Map<string, HttpTypes.AdminPriceListPrice[]>()
  
  // Create a map to track which price sets belong to which variants
  const variantPriceSetMap = new Map<string, string>()
  
  // Step 1: Collect all price sets from variants in products
  for (const product of products || []) {
    if (product.variants && Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        if (variant.prices && Array.isArray(variant.prices)) {
          for (const price of variant.prices) {
            if (price.price_set_id) {
              // Map this variant to its price set
              variantPriceSetMap.set(variant.id, price.price_set_id)
              break // We only need one price to identify the price set
            }
          }
        }
      }
    }
  }
  
  // Step 2: Group price list prices by price_set_id
  for (const price of priceList.prices) {
    if (price.price_set_id) {
      if (!priceSetMap.has(price.price_set_id)) {
        priceSetMap.set(price.price_set_id, [])
      }
      const prices = priceSetMap.get(price.price_set_id)
      if (prices) {
        prices.push(price)
      }
    }
  }

  // Step 3: Clone products to avoid mutating the original array
  return products.map(product => {
    // Clone the product to avoid mutating the original
    const enhancedProduct = { ...product }
    
    // Ensure variants array exists
    if (!enhancedProduct.variants) {
      enhancedProduct.variants = []
      return enhancedProduct
    }
    
    // Enhance each variant with price list prices
    enhancedProduct.variants = enhancedProduct.variants.map(variant => {
      // Clone the variant to avoid mutating the original
      const enhancedVariant = { ...variant }
      
      // Get the price_set_id for this variant from our mapping
      const variantPriceSetId = variantPriceSetMap.get(enhancedVariant.id)
      
      if (variantPriceSetId && priceSetMap.has(variantPriceSetId)) {
        // Get all prices for this price set
        const priceSetPrices = priceSetMap.get(variantPriceSetId) || []
        
        if (priceSetPrices.length > 0) {
          // @ts-ignore - Adding a non-standard property
          enhancedVariant.price_list_prices = priceSetPrices
        }
      } else {
        // Initialize with empty array to avoid undefined
        // @ts-ignore - Adding a non-standard property
        enhancedVariant.price_list_prices = []
      }
      
      return enhancedVariant
    })
    
    return enhancedProduct
  })
}

export const PriceListPricesEdit = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get("ids[]")
  const [enhancedProducts, setEnhancedProducts] = useState<HttpTypes.AdminProduct[]>([])
  const [priceListProducts, setPriceListProducts] = useState<string[]>([])
  const [variantIds, setVariantIds] = useState<string[]>([])
  const [isLoadingVariantIds, setIsLoadingVariantIds] = useState<boolean>(true)

  // Load the price list data
  const { price_list, isLoading, isError, error } = usePriceList(id!)
  
  // Ensure price_list is properly structured
  const normalizedPriceList = Array.isArray(price_list) ? price_list[0] : price_list
  
  // Get the product IDs from the URL query
  const productIds = useMemo(() => {
    return ids?.split(",").filter(Boolean) || []
  }, [ids])

  // Fetch variant IDs for the price list using the same approach as in PriceListProductSection
  const fetchPriceListVariants = useCallback(async () => {
    if (!id) return
    
    try {
      setIsLoadingVariantIds(true)
      
      // Step 1: Fetch detailed price list data with prices
      const priceListResponse = await fetchQuery(`/vendor/price-lists/${id}`, {
        method: 'GET',
      })
      
      // Extract price list data
      const priceListData = Array.isArray(priceListResponse?.price_list) 
        ? priceListResponse?.price_list[0] 
        : priceListResponse?.price_list
      
      if (!priceListData) {
        console.error('Could not extract price list data from response')
        setVariantIds([])
        return
      }
      
      // Check prices array
      if (!priceListData.prices || !Array.isArray(priceListData.prices) || priceListData.prices.length === 0) {
        console.warn('No prices array found in price list or it is empty')
        setVariantIds([])
        return
      }
      
      // Step 2: Extract variant IDs from prices
      let extractedVariantIds: string[] = []
      
      if (priceListData.prices[0].price_set?.variant?.id) {
        // Extract variant IDs from price_set.variant
        extractedVariantIds = priceListData.prices
          .filter((price: any) => price.price_set?.variant?.id)
          .map((price: any) => price.price_set.variant.id)
      }
      else if (priceListData.prices[0].variant_id) {
        // Fallback to direct variant_id property if available
        extractedVariantIds = priceListData.prices
          .filter((price: any) => price.variant_id)
          .map((price: any) => price.variant_id)
      }
      
      // Deduplicate variant IDs
      const uniqueVariantIds = [...new Set(extractedVariantIds)]
      
      setVariantIds(uniqueVariantIds)
      
      // Step 3: Fetch products that contain these variants
      if (uniqueVariantIds.length > 0) {
        const productsResponse = await fetchQuery(`/vendor/products?variant_id=${uniqueVariantIds.join(',')}`, {
          method: 'GET',
        })
        
        if (productsResponse?.products) {
          const productIds = productsResponse.products.map((p: any) => p.id)
          setPriceListProducts(productIds)
        }
      }
    } catch (error) {
      console.error('Error fetching price list variants:', error)
    } finally {
      setIsLoadingVariantIds(false)
    }
  }, [id])
  
  // Fetch variant IDs when component mounts
  useEffect(() => {
    fetchPriceListVariants()
  }, [fetchPriceListVariants])

  // Load products with their variants
  const {
    products: allProducts,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productError,
  } = useProducts({
    fields: "id,title,thumbnail,variants,prices",
    ...(productIds.length > 0 ? { ids: productIds } : 
       priceListProducts.length > 0 ? { ids: priceListProducts } : {})
  })
  
  // Filter products to only include those with variants in the price list
  const filteredProducts = useMemo(() => {
    if (!allProducts?.length) return []
    
    // If specific product IDs were provided from URL, don't filter further
    if (productIds.length > 0) {
      return allProducts
    }
    
    // If we're using products fetched by variant IDs, don't filter further
    if (priceListProducts.length > 0) {
      return allProducts
    }
    
    // Fallback: filter by variant IDs directly
    return allProducts.filter(product => 
      product.variants?.some(variant => variantIds.includes(variant.id))
    )
  }, [allProducts, productIds, priceListProducts, variantIds])

  // Load currency data for the price form
  const { isReady, regions, currencies, pricePreferences } = usePriceListCurrencyData()

  // Enhance products with price list prices when both products and price list are loaded
  useEffect(() => {
    if (filteredProducts?.length && normalizedPriceList?.prices?.length) {
      const enhanced = enhanceProductsWithPriceListPrices(filteredProducts, normalizedPriceList)
      setEnhancedProducts(enhanced)
    }
  }, [filteredProducts, normalizedPriceList])

  // Determine if we're ready to show the form
  const isDataReady = !isLoading && 
                      !!normalizedPriceList && 
                      !isProductsLoading && 
                      !isLoadingVariantIds &&
                      !!filteredProducts?.length && 
                      isReady && 
                      !!enhancedProducts?.length

  // Handle errors
  if (isError) {
    throw error
  }

  if (isProductsError) {
    throw productError
  }

  // Render loading state
  if (isLoading || isProductsLoading || !isReady) {
    return (
      <RouteFocusModal>
        <div className="p-8 text-center">Loading price list data...</div>
      </RouteFocusModal>
    )
  }

  // Render empty state
  if (!normalizedPriceList) {
    return (
      <RouteFocusModal>
        <div className="p-8 text-center">Price list not found</div>
      </RouteFocusModal>
    )
  }

  // Render no products state
  if (!filteredProducts?.length) {
    return (
      <RouteFocusModal>
        <div className="p-8 text-center">No products found for this price list</div>
      </RouteFocusModal>
    )
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">Edit Prices for {normalizedPriceList.title}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        Update prices for products in the price list
      </RouteFocusModal.Description>
      {isDataReady ? (
        <PriceListPricesEditForm
          priceList={normalizedPriceList}
          products={enhancedProducts}
          regions={regions || []}
          currencies={currencies || []}
          pricePreferences={pricePreferences || []}
        />
      ) : (
        <div className="p-8 text-center">Processing product data...</div>
      )}
    </RouteFocusModal>
  )
}