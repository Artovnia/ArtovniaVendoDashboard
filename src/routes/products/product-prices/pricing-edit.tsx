
import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useMemo } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { RouteFocusModal, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import { useUpdateProductVariantsBatch, productsQueryKeys, variantsQueryKeys } from "../../../hooks/api/products"
import { useRegions } from "../../../hooks/api/regions"
import { castNumber } from "../../../lib/cast-number"
import { VariantPricingForm } from "../common/variant-pricing-form"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

export const UpdateVariantPricesSchema = zod.object({
  variants: zod.array(
    zod.object({
      prices: zod
        .record(zod.string(), zod.string().or(zod.number()))
        .optional(),
    })
  ),
})

export type UpdateVariantPricesSchemaType = zod.infer<
  typeof UpdateVariantPricesSchema
>

export const PricingEdit = ({
  product,
  variantId,
}: {
  product: HttpTypes.AdminProduct
  variantId?: string
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { mutateAsync, isPending } = useUpdateProductVariantsBatch(product.id)

  const { regions } = useRegions({ limit: 9999 })
  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {} as Record<string, string>
    }

    return regions.reduce<Record<string, string>>((acc, reg) => {
      acc[reg.id] = reg.currency_code
      return acc
    }, {})
  }, [regions])

  // Ensure variants is always an array
  const variants = (variantId
    ? product.variants?.filter((v) => v.id === variantId)
    : product.variants) || []

  const form = useForm<UpdateVariantPricesSchemaType>({
    defaultValues: {
      variants: variants.map((variant) => ({
        title: variant.title,
        prices: (variant.prices || []).reduce<Record<string, number | string>>((acc, price) => {
          // Handle price.rules which might not exist in the type definition
          const priceRules = price as unknown as { rules?: { region_id?: string } }
          
          if (priceRules.rules?.region_id) {
            acc[priceRules.rules.region_id] = price.amount
          } else {
            acc[price.currency_code || ''] = price.amount
          }
          return acc
        }, {}),
      })),
    },

    resolver: zodResolver(UpdateVariantPricesSchema, {}),
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      // Create variant updates as an array
      const variantUpdates = values.variants.map((variant, ind) => {
        // Ensure variants[ind] exists
        if (!variants[ind]) {
          console.error(`Variant at index ${ind} not found`);
          return { id: '', prices: [] };
        }
        
        return {
          id: variants[ind].id,
          prices: Object.entries(variant.prices || {})
            .filter(
              ([_, value]) => value !== "" && value !== undefined && value !== null // deleted cells
            )
            .map(([currencyCodeOrRegionId, value]) => {
              const regionId = currencyCodeOrRegionId.startsWith("reg_")
                ? currencyCodeOrRegionId
                : undefined
              const currencyCode = currencyCodeOrRegionId.startsWith("reg_")
                ? regionsCurrencyMap[regionId || ''] || ''
                : currencyCodeOrRegionId

              let existingId = undefined

              if (regionId) {
                // Type assertion for the price object to include rules property
                type PriceWithRules = HttpTypes.AdminPrice & { rules?: { region_id?: string } }
                
                existingId = variants[ind]?.prices?.find(
                  (p) => {
                    const priceWithRules = p as unknown as PriceWithRules
                    return priceWithRules.rules?.region_id === regionId
                  }
                )?.id
              } else {
                // Type assertion for the price object to include rules property
                type PriceWithRules = HttpTypes.AdminPrice & { rules?: Record<string, unknown> }
                
                existingId = variants[ind]?.prices?.find(
                  (p) => {
                    const priceWithRules = p as unknown as PriceWithRules
                    return p.currency_code === currencyCode &&
                      Object.keys(priceWithRules.rules || {}).length === 0
                  }
                )?.id
              }

            const amount = castNumber(value)

            return {
              id: existingId,
              currency_code: currencyCode,
              amount,
              ...(regionId ? { rules: { region_id: regionId } } : {}),
            }
          }),
        };
      });
      
      // Filter out any invalid variants (those without IDs)
      const validVariants = variantUpdates.filter(variant => !!variant.id);
      
      console.log('Processing variant updates:', validVariants);
      
      // Instead of using the batch endpoint, update each variant individually
      const productId = product?.id;
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      // Set loading state
      let hasError = false;
      
      // Update each variant individually using the fetchQuery client
      for (const variant of validVariants) {
        try {
          const variantId = variant.id;
          console.log(`Updating variant ${variantId} with prices:`, variant.prices);
          
          // Use the fetchQuery client to update the variant
          await fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
            method: 'POST',
            body: {
              prices: variant.prices,
            },
          }).catch(error => {
            console.error(`Error updating variant ${variantId}:`, error);
            hasError = true;
          });
        } catch (err) {
          console.error(`Error updating variant:`, err);
          hasError = true;
        }
      }
      
      // Invalidate relevant caches to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      
      // Handle success or error
      if (!hasError) {
        handleSuccess("..");
      }
    } catch (error) {
      console.error('Error updating variants:', error);
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <VariantPricingForm form={form as unknown as UseFormReturn<any>} />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex w-full items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
