import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchPriceListPrices } from "../../../../../hooks/api/price-lists-batch"
import { castNumber } from "../../../../../lib/cast-number"
import { usePriceListGridColumns } from "../../../common/hooks/use-price-list-grid-columns"
import {
  PriceListUpdateProductVariantsSchema,
  PriceListUpdateProductsSchema,
} from "../../../common/schemas"
import { isProductRow } from "../../../common/utils"

type PriceListPricesEditFormProps = {
  priceList: HttpTypes.AdminPriceList
  products: HttpTypes.AdminProduct[]
  regions: HttpTypes.AdminRegion[]
  currencies: HttpTypes.AdminStoreCurrency[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const PricingProductPricesSchema = z.object({
  products: PriceListUpdateProductsSchema,
})

export const PriceListPricesEditForm = ({
  priceList,
  products,
  regions,
  currencies,
  pricePreferences,
}: PriceListPricesEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()

  const initialValue = useRef(initRecord(priceList, products))

  const form = useForm<z.infer<typeof PricingProductPricesSchema>>({
    defaultValues: {
      products: initialValue.current,
    },
    resolver: zodResolver(PricingProductPricesSchema),
  })

  const { mutateAsync, isPending } = useBatchPriceListPrices(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const { products } = values

    const { pricesToDelete, pricesToCreate, pricesToUpdate } = sortPrices(
      products,
      initialValue.current,
      regions
    )

    // Convert our sorted prices into the format expected by the API
    // The API expects a prices array containing all price operations
    const prices = [
      // Prices to create
      ...pricesToCreate.map(price => ({
        ...price,
        // No operation needed, creating is the default
      })),
      // Prices to update
      ...pricesToUpdate.map(price => ({
        ...price,
        // Make sure we include the ID for updates
        id: price.id,
      })),
      // Prices to delete
      ...pricesToDelete.map(id => ({
        id: id,
        delete: true, // Flag that this price should be deleted
      })),
    ]

    console.log('Submitting batch prices update with', {
      totalPrices: prices.length,
      create: pricesToCreate.length,
      update: pricesToUpdate.length,
      delete: pricesToDelete.length
    });

    mutateAsync(
      {
        prices: prices, // Use the proper format expected by the API
      },
      {
        onSuccess: () => {
          toast.success(t("priceLists.products.edit.successToast"))

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const columns = usePriceListGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <DataGrid
            columns={columns}
            data={products}
            getSubRows={(row) => {
              if (isProductRow(row) && row.variants) {
                return row.variants
              }
            }}
            state={form}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function initRecord(
  priceList: HttpTypes.AdminPriceList,
  products: HttpTypes.AdminProduct[]
): PriceListUpdateProductsSchema {
  // Initialize an empty record
  const record: PriceListUpdateProductsSchema = {}

  // Safety check for price list prices
  if (!priceList?.prices || !Array.isArray(priceList.prices)) {
    console.log('No prices found in price list or prices is not an array')
    // Return empty record with product structure
    for (const product of products || []) {
      if (product?.id) {
        record[product.id] = {
          variants: {}
        }
      }
    }
    return record
  }

  console.log(`Processing ${priceList.prices.length} prices from price list`)
  
  // First, create a map of price_set_id to prices
  const priceSetMap = new Map<string, any[]>()
  
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
              console.log(`Mapped variant ${variant.id} to price set ${price.price_set_id}`)
              break // We only need one price to identify the price set
            }
          }
        }
      }
    }
  }
  
  console.log('Variant to price set mapping:', Array.from(variantPriceSetMap.entries()))
  
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
      console.log(`Added price ${price.id} with amount ${price.amount} to price set ${price.price_set_id}`)
    } else {
      console.log('Price has no price_set_id:', price)
    }
  }
  
  console.log('Price sets with prices:', Array.from(priceSetMap.keys()))

  // Step 3: Process each product and its variants
  for (const product of products || []) {
    if (!product?.id) {
      console.log('Skipping product without ID')
      continue
    }

    // Initialize product record
    record[product.id] = {
      variants: {}
    }

    // Process variants if they exist
    if (product.variants && Array.isArray(product.variants)) {
      const variantMap = product.variants.reduce((variants, variant) => {
        if (!variant?.id) {
          console.log('Skipping variant without ID')
          return variants
        }
        
        // Initialize prices for this variant
        const variantPrices: any = {
          currency_prices: {},
          region_prices: {}
        }
        
        // Get the price_set_id for this variant from our mapping
        const variantPriceSetId = variantPriceSetMap.get(variant.id)
        
        if (variantPriceSetId && priceSetMap.has(variantPriceSetId)) {
          // Get all prices for this price set
          const priceSetPrices = priceSetMap.get(variantPriceSetId) || []
          console.log(`Found ${priceSetPrices.length} prices for variant ${variant.id} via price_set_id ${variantPriceSetId}`)
          
          // Process each price in the price set
          priceSetPrices.forEach((price: any) => {
            // Determine if this is a region price or currency price
            const isRegionPrice = !!price.rules?.region_id
            
            if (isRegionPrice) {
              const regionId = price.rules.region_id as string
              
              // Add region price
              variantPrices.region_prices[regionId] = {
                amount: price.amount.toString(),
                id: price.id,
              }
              console.log(`Added region price ${price.id} for region ${regionId} to variant ${variant.id}`)
            } else {
              // Add currency price
              variantPrices.currency_prices[price.currency_code] = {
                amount: price.amount.toString(),
                id: price.id,
              }
              console.log(`Added currency price ${price.id} for currency ${price.currency_code} to variant ${variant.id}`)
            }
          })
        } else {
          console.log(`No price set found for variant ${variant.id} with price_set_id ${variantPriceSetId || 'undefined'}`)
        }
        
        // Store prices for this variant
        variants[variant.id] = variantPrices
        return variants
      }, {} as PriceListUpdateProductVariantsSchema)

      // Assign variants to product record
      record[product.id].variants = variantMap
    }
  }

  console.log('Final record:', record)
  return record
}

type PriceObject = {
  variantId: string
  currencyCode: string
  regionId?: string
  amount: number
  id?: string | null
}

function convertToPriceArray(
  data: PriceListUpdateProductsSchema,
  regions: HttpTypes.AdminRegion[]
) {
  const prices: PriceObject[] = []

  const regionCurrencyMap = regions.reduce(
    (map, region) => {
      map[region.id] = region.currency_code
      return map
    },
    {} as Record<string, string>
  )

  for (const [_productId, product] of Object.entries(data || {})) {
    const { variants } = product || {}

    for (const [variantId, variant] of Object.entries(variants || {})) {
      const { currency_prices: currencyPrices, region_prices: regionPrices } =
        variant || {}

      for (const [currencyCode, currencyPrice] of Object.entries(
        currencyPrices || {}
      )) {
        if (
          currencyPrice?.amount !== "" &&
          typeof currencyPrice?.amount !== "undefined"
        ) {
          prices.push({
            variantId,
            currencyCode,
            amount: castNumber(currencyPrice.amount),
            id: currencyPrice.id,
          })
        }
      }

      for (const [regionId, regionPrice] of Object.entries(
        regionPrices || {}
      )) {
        if (
          regionPrice?.amount !== "" &&
          typeof regionPrice?.amount !== "undefined"
        ) {
          prices.push({
            variantId,
            regionId,
            currencyCode: regionCurrencyMap[regionId],
            amount: castNumber(regionPrice.amount),
            id: regionPrice.id,
          })
        }
      }
    }
  }

  return prices
}

function createMapKey(obj: PriceObject) {
  return `${obj.variantId}-${obj.currencyCode}-${obj.regionId || "none"}-${
    obj.id || "none"
  }`
}

function comparePrices(initialPrices: PriceObject[], newPrices: PriceObject[]) {
  const pricesToUpdate: HttpTypes.AdminUpdatePriceListPrice[] = []
  const pricesToCreate: HttpTypes.AdminCreatePriceListPrice[] = []
  const pricesToDelete: string[] = []

  const initialPriceMap = initialPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, (typeof initialPrices)[0]>
  )

  const newPriceMap = newPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, (typeof newPrices)[0]>
  )

  const keys = new Set([
    ...Object.keys(initialPriceMap),
    ...Object.keys(newPriceMap),
  ])

  for (const key of keys) {
    const initialPrice = initialPriceMap[key]
    const newPrice = newPriceMap[key]

    if (initialPrice && newPrice) {
      if (isNaN(newPrice.amount) && newPrice.id) {
        pricesToDelete.push(newPrice.id)
      }

      if (initialPrice.amount !== newPrice.amount && newPrice.id) {
        pricesToUpdate.push({
          id: newPrice.id,
          variant_id: newPrice.variantId,
          currency_code: newPrice.currencyCode,
          rules: newPrice.regionId
            ? { region_id: newPrice.regionId }
            : undefined,
          amount: newPrice.amount,
        })
      }
    }

    if (!initialPrice && newPrice) {
      pricesToCreate.push({
        variant_id: newPrice.variantId,
        currency_code: newPrice.currencyCode,
        rules: newPrice.regionId ? { region_id: newPrice.regionId } : undefined,
        amount: newPrice.amount,
      })
    }

    if (initialPrice && !newPrice && initialPrice.id) {
      pricesToDelete.push(initialPrice.id)
    }
  }

  return { pricesToDelete, pricesToCreate, pricesToUpdate }
}

function sortPrices(
  data: PriceListUpdateProductsSchema,
  initialValue: PriceListUpdateProductsSchema,
  regions: HttpTypes.AdminRegion[]
) {
  const initialPrices = convertToPriceArray(initialValue, regions)
  const newPrices = convertToPriceArray(data, regions)

  return comparePrices(initialPrices, newPrices)
}
