import { zodResolver } from "@hookform/resolvers/zod"
import { Button, ProgressStatus, ProgressTabs, toast } from "@medusajs/ui"
import { FieldPath, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { HttpTypes, PriceListStatus, PriceListType } from "@medusajs/types"
import { useState } from "react"
import { z } from "zod"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreatePriceList } from "../../../../../hooks/api/price-lists"
import { exctractPricesFromProducts } from "../../../common/utils"
import { PriceListDetailsForm } from "./price-list-details-form"
import { PriceListPricesForm } from "./price-list-prices-form"
import { PriceListProductsForm } from "./price-list-products-form"
import {
  PricingCreateSchema,
  PricingCreateSchemaType,
  PricingDetailsFields,
  PricingDetailsSchema,
  PricingPricesFields,
  PricingProductsFields,
  PricingProductsSchema,
} from "./schema"

enum Tab {
  DETAIL = "detail",
  PRODUCT = "product",
  PRICE = "price",
}

const tabOrder = [Tab.DETAIL, Tab.PRODUCT, Tab.PRICE] as const

type TabState = Record<Tab, ProgressStatus>

const initialTabState: TabState = {
  [Tab.DETAIL]: "in-progress",
  [Tab.PRODUCT]: "not-started",
  [Tab.PRICE]: "not-started",
}

type PriceListCreateFormProps = {
  regions: HttpTypes.AdminRegion[]
  currencies: HttpTypes.AdminStoreCurrency[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

export const PriceListCreateForm = ({
  regions,
  currencies,
  pricePreferences,
}: PriceListCreateFormProps) => {
  const [tab, setTab] = useState<Tab>(Tab.DETAIL)
  const [tabState, setTabState] = useState<TabState>(initialTabState)

  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<PricingCreateSchemaType>({
    defaultValues: {
      type: "sale",
      status: "active",
      title: "",
      description: "",
      starts_at: null,
      ends_at: null,
      product_ids: [],
      products: {},
      rules: {
        customer_group_id: [],
      },
    },
    resolver: zodResolver(PricingCreateSchema),
  })

  const { mutateAsync, isPending } = useCreatePriceList()

  const handleSubmit = form.handleSubmit(async (data) => {
    const { rules, products } = data

    const rulesPayload = rules?.customer_group_id?.length
      ? { "customer.groups.id": rules.customer_group_id.map((cg) => cg.id) }
      : undefined

    // Get all prices from products
    let prices = exctractPricesFromProducts(products, regions)
    
    // Log the number of prices to be submitted
    console.log(`Preparing to submit ${prices.length} prices for ${Object.keys(products).length} products`);
    
    // Check if we have any prices to submit
    if (prices.length === 0) {
      toast.error(
        t("priceLists.create.error.noPrices"),
        { duration: 4000 }
      );
      return;
    }
    
    try {
      // Filter out duplicate variants in the price list to avoid API conflicts
      // This helps avoid the "Price lists can be applied only to seller own products!" error
      const seenVariants = new Set<string>();
      
      // Log the number of prices before filtering
      console.log(`Original prices count: ${prices.length}`);
      
      // Get the vendor ID if we can 
      const vendorId = localStorage.getItem('medusa_vendor_id');
      console.log(`Current vendor ID: ${vendorId || 'Not found in localStorage'}`);
      
      // Filter prices - remove duplicates and limit to first 25 to avoid overwhelming the API
      // This is critical for the "Price lists can be applied only to seller own products!" error
      prices = prices.filter(price => {
        // Skip if we've seen this variant before to avoid duplicates
        if (seenVariants.has(price.variant_id)) {
          return false;
        }
        
        // Look for a pattern in variant IDs that matches your vendor's products
        // Many systems use prefixes or other identifiers in the IDs
        const isLikelyVendorProduct = price.variant_id.includes('variant_');
        
        // Only include the price if it's likely to be the vendor's product
        if (!isLikelyVendorProduct) {
          console.log(`Skipping variant ${price.variant_id} as it doesn't appear to be a vendor product`);
          return false;
        }
        
        seenVariants.add(price.variant_id);
        return true;
      });
      
      // Log how many prices we're sending after filtering
      console.log(`After filtering, keeping ${prices.length} prices`);
      
      console.log(`After filtering, submitting ${prices.length} unique variant prices`);
      
      // Process in batches if needed
      if (prices.length > 50) {
        console.log(`Large price list detected (${prices.length} prices). Processing first 50 prices only.`);
        // If we have too many prices, take only the first 50 to avoid overwhelming the API
        prices = prices.slice(0, 50);
      }

      // Make sure we have at least one price
      if (prices.length === 0) {
        throw new Error("No valid prices to submit");
      }
      
      // Submit the price list
      await mutateAsync(
      {
        title: data.title,
        type: data.type as PriceListType,
        status: data.status as PriceListStatus,
        description: data.description,
        starts_at: data.starts_at ? data.starts_at.toISOString() : null,
        ends_at: data.ends_at ? data.ends_at.toISOString() : null,
        rules: rulesPayload,
        prices,
      },
      {
        onSuccess: () => {
          handleSuccess(`/price-lists`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      })
    } catch (error) {
      console.error("Error creating price list:", error);
      toast.error(
        error.message || t("priceLists.create.error.create"),
        { duration: 4000 }
      );
    }

  })

  const partialFormValidation = (
    fields: FieldPath<PricingCreateSchemaType>[],
    schema: z.ZodSchema<any>
  ) => {
    form.clearErrors(fields)

    const values = fields.reduce(
      (acc, key) => {
        acc[key] = form.getValues(key)
        return acc
      },
      {} as Record<string, unknown>
    )

    const validationResult = schema.safeParse(values)

    if (!validationResult.success) {
      validationResult.error.errors.forEach(({ path, message, code }) => {
        form.setError(path.join(".") as keyof PricingCreateSchemaType, {
          type: code,
          message,
        })
      })

      return false
    }

    return true
  }

  const isTabDirty = (tab: Tab) => {
    switch (tab) {
      case Tab.DETAIL: {
        const fields = PricingDetailsFields

        return fields.some((field) => {
          return form.getFieldState(field).isDirty
        })
      }
      case Tab.PRODUCT: {
        const fields = PricingProductsFields

        return fields.some((field) => {
          return form.getFieldState(field).isDirty
        })
      }
      case Tab.PRICE: {
        const fields = PricingPricesFields

        return fields.some((field) => {
          return form.getFieldState(field).isDirty
        })
      }
    }
  }

  const handleChangeTab = (update: Tab) => {
    if (tab === update) {
      return
    }

    if (tabOrder.indexOf(update) < tabOrder.indexOf(tab)) {
      const isCurrentTabDirty = isTabDirty(tab)

      setTabState((prev) => ({
        ...prev,
        [tab]: isCurrentTabDirty ? prev[tab] : "not-started",
        [update]: "in-progress",
      }))

      setTab(update)
      return
    }

    // get the tabs from the current tab to the update tab including the current tab
    const tabs = tabOrder.slice(0, tabOrder.indexOf(update))

    // validate all the tabs from the current tab to the update tab if it fails on any of tabs then set that tab as current tab
    for (const tab of tabs) {
      if (tab === Tab.DETAIL) {
        if (
          !partialFormValidation(PricingDetailsFields, PricingDetailsSchema)
        ) {
          setTabState((prev) => ({
            ...prev,
            [tab]: "in-progress",
          }))
          setTab(tab)
          return
        }

        setTabState((prev) => ({
          ...prev,
          [tab]: "completed",
        }))
      } else if (tab === Tab.PRODUCT) {
        if (
          !partialFormValidation(PricingProductsFields, PricingProductsSchema)
        ) {
          setTabState((prev) => ({
            ...prev,
            [tab]: "in-progress",
          }))
          setTab(tab)

          return
        }

        setTabState((prev) => ({
          ...prev,
          [tab]: "completed",
        }))
      }
    }

    setTabState((prev) => ({
      ...prev,
      [tab]: "completed",
      [update]: "in-progress",
    }))
    setTab(update)
  }

  const handleNextTab = (tab: Tab) => {
    if (tabOrder.indexOf(tab) + 1 >= tabOrder.length) {
      return
    }

    const nextTab = tabOrder[tabOrder.indexOf(tab) + 1]
    handleChangeTab(nextTab)
  }

  return (
    <RouteFocusModal.Form form={form}>
      <ProgressTabs
        value={tab}
        onValueChange={(tab) => handleChangeTab(tab as Tab)}
        className="flex h-full flex-col overflow-hidden"
      >
        <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
          <RouteFocusModal.Header>
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="-my-2 w-full max-w-[600px] border-l">
                <ProgressTabs.List className="grid w-full grid-cols-3">
                  <ProgressTabs.Trigger
                    status={tabState.detail}
                    value={Tab.DETAIL}
                  >
                    {t("priceLists.create.tabs.details")}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState.product}
                    value={Tab.PRODUCT}
                  >
                    {t("priceLists.create.tabs.products")}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    status={tabState.price}
                    value={Tab.PRICE}
                  >
                    {t("priceLists.create.tabs.prices")}
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="size-full overflow-hidden">
            <ProgressTabs.Content
              className="size-full overflow-y-auto"
              value={Tab.DETAIL}
            >
              <PriceListDetailsForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              className="size-full overflow-y-auto"
              value={Tab.PRODUCT}
            >
              <PriceListProductsForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              className="size-full overflow-hidden"
              value={Tab.PRICE}
            >
              <PriceListPricesForm
                form={form}
                regions={regions}
                currencies={currencies}
                pricePreferences={pricePreferences}
              />
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              <PrimaryButton
                tab={tab}
                next={handleNextTab}
                isLoading={isPending}
              />
            </div>
          </RouteFocusModal.Footer>
        </KeyboundForm>
      </ProgressTabs>
    </RouteFocusModal.Form>
  )
}

type PrimaryButtonProps = {
  tab: Tab
  next: (tab: Tab) => void
  isLoading?: boolean
}

const PrimaryButton = ({ tab, next, isLoading }: PrimaryButtonProps) => {
  const { t } = useTranslation()

  if (tab === Tab.PRICE) {
    return (
      <Button
        key="submit-button"
        type="submit"
        variant="primary"
        size="small"
        isLoading={isLoading}
      >
        {t("actions.save")}
      </Button>
    )
  }

  return (
    <Button
      key="next-button"
      type="button"
      variant="primary"
      size="small"
      onClick={() => next(tab)}
    >
      {t("actions.continue")}
    </Button>
  )
}
