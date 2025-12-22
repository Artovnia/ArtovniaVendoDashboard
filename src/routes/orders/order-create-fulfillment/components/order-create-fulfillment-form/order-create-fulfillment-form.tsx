import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { AdminOrder, HttpTypes } from "@medusajs/types"
import { Alert, Button, Select, Switch, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"

import { OrderLineItemDTO } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateOrderFulfillment } from "../../../../../hooks/api/orders"
import { useStockLocations } from "../../../../../hooks/api/stock-locations"
import { getFulfillableQuantity } from "../../../../../lib/order-item"
import { CreateFulfillmentSchema } from "./constants"
import { OrderCreateFulfillmentItem } from "./order-create-fulfillment-item"
import {
  useReservationItems,
  useShippingOptions,
} from "../../../../../hooks/api"
import { ParcelSelector } from "./parcel-selector"
import { fetchQuery } from "../../../../../lib/client"

type OrderCreateFulfillmentFormProps = {
  order: AdminOrder
  requiresShipping: boolean
}

export function OrderCreateFulfillmentForm({
  order,
  requiresShipping,
}: OrderCreateFulfillmentFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync: createOrderFulfillment, isPending: isMutating } =
    useCreateOrderFulfillment(order.id)

  const { reservations: reservationsRaw } = useReservationItems()

  const reservations = reservationsRaw?.filter((r) =>
    order.items.some((i) => i.id === r.line_item_id)
  )

  const itemReservedQuantitiesMap = useMemo(
    () =>
      new Map(
        (reservations || [])
          .filter((r) => r.line_item_id !== null)
          .map((r) => [r.line_item_id as string, r.quantity])
      ),
    [reservations]
  )

  const [fulfillableItems, setFulfillableItems] = useState(() =>
    (order.items || []).filter(
      (item) =>
        item.requires_shipping === requiresShipping &&
        getFulfillableQuantity(item as any) > 0
    )
  )

  const [parcels, setParcels] = useState<any[]>([])
  const [isLoadingParcels, setIsLoadingParcels] = useState(false)
  const [selectedParcels, setSelectedParcels] = useState<number[]>([])
  const [useParcels, setUseParcels] = useState(false)

  const form = useForm<zod.infer<typeof CreateFulfillmentSchema>>({
    defaultValues: {
      quantity: fulfillableItems.reduce(
        (acc, item) => {
          acc[item.id] = getFulfillableQuantity(item as any)
          return acc
        },
        {} as Record<string, number>
      ),
      send_notification: true,
      selected_parcels: [],
      use_parcels: false,
    },
    resolver: zodResolver(CreateFulfillmentSchema),
  })

  const selectedLocationId = useWatch({
    name: "location_id",
    control: form.control,
  })

  const { stock_locations = [] } = useStockLocations()

  const { shipping_options = [], isLoading: isShippingOptionsLoading } =
    useShippingOptions({
      fields: "+service_zone.fulfillment_set.location.id",
    })

  const filteredShippingOptions = shipping_options.filter((o) => o !== null)

  const shippingOptionId = useWatch({
    name: "shipping_option_id",
    control: form.control,
  })

  // Fetch parcel calculation when location is selected
  useEffect(() => {
    const fetchParcels = async () => {
      if (!selectedLocationId || !order.id) return

      setIsLoadingParcels(true)
      try {
        const data = await fetchQuery(`/vendor/orders/${order.id}/parcels`, {
          method: 'GET'
        })
        
        if (data.parcels && data.parcels.length > 0) {
          setParcels(data.parcels)
          // Auto-enable parcel mode if multiple shipping methods
          if (data.parcels.length > 1 || order.shipping_methods?.length > 1) {
            setUseParcels(true)
            form.setValue('use_parcels', true)
            // Select all parcels by default
            const allParcelNumbers = data.parcels.map((p: any) => p.parcel_number)
            setSelectedParcels(allParcelNumbers)
            form.setValue('selected_parcels', allParcelNumbers)
          } else {
            // Single parcel - select it by default
            setSelectedParcels([1])
            form.setValue('selected_parcels', [1])
          }
        }
      } catch (error: any) {
        console.error('Error fetching parcels:', error)
        toast.error('Failed to calculate parcels')
      } finally {
        setIsLoadingParcels(false)
      }
    }

    fetchParcels()
  }, [selectedLocationId, order.id])

  const handleParcelToggle = (parcelNumber: number) => {
    setSelectedParcels(prev => {
      const newSelection = prev.includes(parcelNumber)
        ? prev.filter(n => n !== parcelNumber)
        : [...prev, parcelNumber]
      form.setValue('selected_parcels', newSelection)
      return newSelection
    })
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!selectedLocationId) {
      form.setError("location_id", {
        type: "manual",
        message: t("orders.fulfillment.error.noLocation"),
      })
      return
    }

    try {
      // Multi-parcel mode
      if (useParcels && parcels.length > 0) {
        if (selectedParcels.length === 0) {
          form.setError("root", {
            type: "manual",
            message: "Please select at least one parcel to fulfill",
          })
          return
        }

        // Get selected parcels
        const parcelsToFulfill = parcels.filter(p => 
          selectedParcels.includes(p.parcel_number)
        )

        // Create fulfillment for each selected parcel
        for (const parcel of parcelsToFulfill) {
          console.log('[Fulfillment] Creating fulfillment for parcel:', {
            parcel_number: parcel.parcel_number,
            shipping_method_id: parcel.shipping_method_id,
            shipping_profile: parcel.shipping_profile,
            items: parcel.items.map((i: any) => ({
              item_id: i.item_id,
              quantity: i.quantity,
              profile_name: i.profile_name
            }))
          })

          // Find the actual order items to check their shipping profiles
          const orderItems = parcel.items.map((item: any) => {
            const orderItem = order.items.find((oi: any) => oi.id === item.item_id)
            console.log('[Fulfillment] Order item:', {
              id: orderItem?.id,
              product_id: orderItem?.product_id,
              shipping_profile_id: orderItem?.variant?.product?.shipping_profile?.id
            })
            return orderItem
          })

          const payload = {
            location_id: selectedLocationId,
            requires_shipping: true,
            items: parcel.items.map((item: any) => ({
              id: item.item_id,
              quantity: item.quantity,
            })),
          }

          await createOrderFulfillment(payload)
        }

        toast.success(
          selectedParcels.length === 1
            ? t("orders.fulfillment.toast.created")
            : `Created ${selectedParcels.length} fulfillments`
        )
        handleSuccess(`/orders/${order.id}`)
        return
      }

      // Legacy single-parcel mode (backwards compatibility)
      const selectedShippingOption = shipping_options.find(
        (o) => o?.id === shippingOptionId
      )

      if (!selectedShippingOption) {
        form.setError("shipping_option_id", {
          type: "manual",
          message: t("orders.fulfillment.error.noShippingOption"),
        })
        return
      }

      const selectedShippingProfileId =
        selectedShippingOption?.shipping_profile_id

      const itemShippingProfileMap = order.items.reduce(
        (acc, item) => {
          acc[item.id] = item.variant?.product?.shipping_profile?.id ?? null
          return acc
        },
        {} as Record<string, string | null>
      )

      const itemsToFulfill = Object.entries(data.quantity)
        .filter(
          ([id, value]) => 
            (value && value > 0) && 
            (!selectedShippingProfileId || itemShippingProfileMap[id] === selectedShippingProfileId)
        )
        .map(([id, quantity]) => ({
          id,
          quantity,
        }))

      if (itemsToFulfill.length === 0) {
        form.setError("root", {
          type: "manual",
          message: t("orders.fulfillment.error.noItems"),
        })
        return
      }

      const payload = {
        location_id: selectedLocationId,
        requires_shipping: true,
        items: itemsToFulfill,
      }
      
      await createOrderFulfillment(payload)
      toast.success(t("orders.fulfillment.toast.created"))
      handleSuccess(`/orders/${order.id}`)
    } catch (e: any) {
      console.error('Fulfillment creation error:', e)
      toast.error(e.message || 'An error occurred during fulfillment creation')
    }
  })

  useEffect(() => {
    if (stock_locations?.length && shipping_options?.length) {
      const initialShippingOptionId =
        order.shipping_methods?.[0]?.shipping_option_id

      if (initialShippingOptionId) {
        const shippingOption = shipping_options.find(
          (o) => o?.id === initialShippingOptionId
        )

        if (shippingOption) {
          const locationId =
            shippingOption.service_zone.fulfillment_set.location.id

          form.setValue("location_id", locationId)
          form.setValue(
            "shipping_option_id",
            initialShippingOptionId || undefined
          )
        } // else -> TODO: what if original shipping option is deleted?
      }
    }
  }, [stock_locations?.length, shipping_options?.length])

  const fulfilledQuantityArray = (order.items || []).map(
    (item) =>
      item.requires_shipping === requiresShipping &&
      item.detail.fulfilled_quantity
  )

  useEffect(() => {
    const itemsToFulfill =
      order?.items?.filter(
        (item) =>
          item.requires_shipping === requiresShipping &&
          getFulfillableQuantity(item as OrderLineItemDTO) > 0
      ) || []

    setFulfillableItems(itemsToFulfill)

    if (itemsToFulfill.length) {
      form.clearErrors("root")
    } else {
      form.setError("root", {
        type: "manual",
        message: t("orders.fulfillment.error.noItems"),
      })
    }

    const quantityMap = itemsToFulfill.reduce(
      (acc, item) => {
        acc[item.id] = getFulfillableQuantity(item as OrderLineItemDTO)
        return acc
      },
      {} as Record<string, number>
    )

    form.setValue("quantity", quantityMap)
  }, [...fulfilledQuantityArray, requiresShipping])

  const differentOptionSelected =
    shippingOptionId &&
    order.shipping_methods?.[0]?.shipping_option_id !== shippingOptionId

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex h-full w-full flex-col items-center divide-y overflow-y-auto">
          <div className="flex size-full flex-col items-center overflow-auto p-16">
            <div className="flex w-full max-w-[736px] flex-col justify-center px-2 pb-2">
              <div className="flex flex-col divide-y divide-dashed">
                <div className="pb-8">
                  <Form.Field
                    control={form.control}
                    name="location_id"
                    render={({ field: { onChange, ref, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex-1">
                              <Form.Label>{t("fields.location")}</Form.Label>
                              <Form.Hint>
                                {t("orders.fulfillment.locationDescription")}
                              </Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control>
                                <Select onValueChange={onChange} {...field}>
                                  <Select.Trigger
                                    className="bg-ui-bg-base"
                                    ref={ref}
                                  >
                                    <Select.Value />
                                  </Select.Trigger>
                                  <Select.Content>
                                    {stock_locations.map((l) => (
                                      <Select.Item key={l.id} value={l.id}>
                                        {l.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select>
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>

                {/* Multi-parcel mode */}
                {useParcels && parcels.length > 0 ? (
                  <div className="py-8">
                    {isLoadingParcels ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-ui-fg-subtle">Loading parcels...</span>
                      </div>
                    ) : (
                      <ParcelSelector
                        parcels={parcels}
                        selectedParcels={selectedParcels}
                        onParcelToggle={handleParcelToggle}
                        currencyCode={order.currency_code}
                      />
                    )}
                    {form.formState.errors.root && (
                      <Alert
                        variant="error"
                        dismissible={false}
                        className="mt-4 flex items-center"
                      >
                        {form.formState.errors.root.message}
                      </Alert>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Legacy single-parcel mode */}
                    <div className="py-8">
                      <Form.Field
                        control={form.control}
                        name="shipping_option_id"
                        render={({ field: { onChange, ref, ...field } }) => {
                          return (
                            <Form.Item>
                              <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                                <div className="flex-1">
                                  <Form.Label>
                                    {t("fields.shippingMethod")}
                                  </Form.Label>
                                  <Form.Hint>
                                    {t("orders.fulfillment.methodDescription")}
                                  </Form.Hint>
                                </div>
                                <div className="flex-1">
                                  <Form.Control>
                                    <Select
                                      onValueChange={onChange}
                                      {...field}
                                      disabled={!selectedLocationId}
                                    >
                                      <Select.Trigger
                                        className="bg-ui-bg-base"
                                        ref={ref}
                                      >
                                        {isShippingOptionsLoading ? (
                                          <span className="text-right">
                                            {t("labels.loading")}
                                            ...
                                          </span>
                                        ) : (
                                          <Select.Value />
                                        )}
                                      </Select.Trigger>
                                      <Select.Content>
                                        {filteredShippingOptions.map((o) => (
                                          <Select.Item key={o?.id} value={o?.id}>
                                            {o?.name}
                                          </Select.Item>
                                        ))}
                                      </Select.Content>
                                    </Select>
                                  </Form.Control>
                                </div>
                              </div>
                              <Form.ErrorMessage />
                            </Form.Item>
                          )
                        }}
                      />

                      {differentOptionSelected && (
                        <Alert className="mt-4 p-4" variant="warning">
                          <span className="-mt-[3px] block font-medium">
                            {t("labels.beaware")}
                          </span>
                          <span className="text-ui-fg-muted">
                            {t("orders.fulfillment.differentOptionSelected")}
                          </span>
                        </Alert>
                      )}
                    </div>
                    <div>
                      <Form.Item className="mt-8">
                        <Form.Label>
                          {t("orders.fulfillment.itemsToFulfill")}
                        </Form.Label>
                        <Form.Hint>
                          {t("orders.fulfillment.itemsToFulfillDesc")}
                        </Form.Hint>

                        <div className="flex flex-col gap-y-1">
                          {fulfillableItems.map((item) => {
                            const isShippingProfileMatching =
                              shipping_options.find(
                                (o) => o?.id === shippingOptionId
                              )?.shipping_profile_id ===
                              item.variant?.product?.shipping_profile?.id
                            return (
                              <OrderCreateFulfillmentItem
                                key={item.id}
                                form={form}
                                item={item}
                                locationId={selectedLocationId}
                                currencyCode={order.currency_code}
                                onItemRemove={() => {}}
                                disabled={!isShippingProfileMatching}
                                itemReservedQuantitiesMap={
                                  itemReservedQuantitiesMap
                                }
                              />
                            )
                          })}
                        </div>
                      </Form.Item>
                      {form.formState.errors.root && (
                        <Alert
                          variant="error"
                          dismissible={false}
                          className="flex items-center"
                        >
                          {form.formState.errors.root.message}
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-8 pt-8 ">
                  <Form.Field
                    control={form.control}
                    name="send_notification"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex items-center justify-between">
                            <Form.Label>
                              {t("orders.returns.sendNotification")}
                            </Form.Label>
                            <Form.Control>
                              <Form.Control>
                                <Switch
                                  checked={!!value}
                                  onCheckedChange={onChange}
                                  {...field}
                                />
                              </Form.Control>
                            </Form.Control>
                          </div>
                          <Form.Hint className="!mt-1">
                            {t("orders.fulfillment.sendNotificationHint")}
                          </Form.Hint>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isMutating}
              disabled={useParcels ? selectedParcels.length === 0 : !shippingOptionId}
            >
              {useParcels && selectedParcels.length > 1
                ? `Fulfill ${selectedParcels.length} Parcels`
                : t("orders.fulfillment.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}