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

  const handleSubmit = form.handleSubmit(async (data) => {
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

    if (!selectedLocationId) {
      form.setError("location_id", {
        type: "manual",
        message: t("orders.fulfillment.error.noLocation"),
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

    // Get all items with quantities greater than 0
    const itemsToFulfill = Object.entries(data.quantity)
      .filter(
        ([id, value]) => 
          // Ensure value is greater than 0
          (value && value > 0) && 
          // Either match shipping profile or don't filter by profile if none selected
          (!selectedShippingProfileId || itemShippingProfileMap[id] === selectedShippingProfileId)
      )
      .map(([id, quantity]) => ({
        id,
        quantity,
      }));

    // Check if we have items to fulfill
    if (itemsToFulfill.length === 0) {
      form.setError("root", {
        type: "manual",
        message: t("orders.fulfillment.error.noItems"),
      });
      return;
    }

    // Format payload to match backend validator requirements
    // Backend only accepts: items, requires_shipping, location_id
    const payload = {
      location_id: selectedLocationId,
      requires_shipping: true,
      items: itemsToFulfill,
      // These fields are used for UI but not sent to backend
      // shipping_option_id and no_notification are not accepted by the backend
    }

    try {
      // Debug logs to help identify the issue
      console.log('Fulfillment payload:', JSON.stringify(payload, null, 2));
      console.log('Selected shipping option:', selectedShippingOption);
      console.log('Items to fulfill:', itemsToFulfill);
      
      await createOrderFulfillment(payload)

      toast.success(t("orders.fulfillment.toast.created"))
      handleSuccess(`/orders/${order.id}`)
    } catch (e: any) {
      console.error('Fulfillment creation error:', e);
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
                      // classNameInner="flex justify-between flex-1 items-center"
                    >
                      {form.formState.errors.root.message}
                    </Alert>
                  )}
                </div>

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
              disabled={!shippingOptionId}
            >
              {t("orders.fulfillment.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}