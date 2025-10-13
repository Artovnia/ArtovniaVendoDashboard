import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLongRight } from "@medusajs/icons"
import { AdminOrder, AdminReturn } from "@medusajs/types"
import { Alert, Button, Input, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { Thumbnail } from "../../../../../components/common/thumbnail"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { fetchQuery } from "../../../../../lib/client"
import { useStockLocation, useStockLocations } from "../../../../../hooks/api/stock-locations"
import {
  useAddReceiveItems,
  useCancelReceiveReturn,
  useConfirmReturnReceive,
  useRemoveReceiveItems,
  useUpdateReceiveItem,
  useUpdateReturn,
} from "../../../../../hooks/api/returns"
import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"
import { ReceiveReturnSchema } from "./constants"
import DismissedQuantity from "./dismissed-quantity"

type OrderAllocateItemsFormProps = {
  order: AdminOrder
  preview: AdminOrder
  orderReturn: AdminReturn
}

export function OrderReceiveReturnForm({
  order,
  preview,
  orderReturn,
}: OrderAllocateItemsFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  // Debug: Log props data
  console.log("🔍 OrderReceiveReturnForm props:", {
    hasOrder: !!order,
    orderId: order?.id,
    hasPreview: !!preview,
    hasOrderReturn: !!orderReturn,
    orderReturnId: orderReturn?.id,
    orderReturnStatus: orderReturn?.status,
    orderReturnItems: orderReturn?.items?.length || 0
  })

  /**
   * Items on the preview order that are part of the return we are receiving currently.
   */
  const previewItems = useMemo(() => {
    const idsMap: Record<string, boolean> = {}

    // Safety check: ensure orderReturn.items exists
    if (orderReturn?.items) {
      orderReturn.items.forEach((i) => (idsMap[i.item_id] = true))
    }

    return preview?.items?.filter((i) => idsMap[i.id]) || []
  }, [preview.items, orderReturn])

  const { mutateAsync: confirmReturnReceive } = useConfirmReturnReceive(
    orderReturn?.id || "",
    order?.id || ""
  )

  const { mutateAsync: cancelReceiveReturn } = useCancelReceiveReturn(
    orderReturn?.id || "",
    order?.id || ""
  )

  const { mutateAsync: addReceiveItems } = useAddReceiveItems(
    orderReturn?.id || "",
    order?.id || ""
  )
  const { mutateAsync: updateReceiveItem } = useUpdateReceiveItem(
    orderReturn?.id || "",
    order?.id || ""
  )
  const { mutateAsync: removeReceiveItem } = useRemoveReceiveItems(
    orderReturn?.id || "",
    order?.id || ""
  )

  const { mutateAsync: updateReturn } = useUpdateReturn(
    orderReturn?.id || "",
    order?.id || ""
  )

  // Fetch available stock locations
  const { stock_locations } = useStockLocations()

  const { stock_location } = useStockLocation(
    orderReturn?.location_id || "",
    undefined,
    {
      enabled: !!orderReturn?.location_id,
    }
  )

  // Check if return has no location but locations are available
  const needsLocationAssignment = !orderReturn?.location_id && (stock_locations?.length || 0) > 0
  const defaultLocation = stock_locations?.[0] // Use first available location as default

  const itemsMap = useMemo(() => {
    const ret: Record<string, any> = {}
    if (order?.items) {
      order.items.forEach((i) => (ret[i.id] = i))
    }
    return ret
  }, [order?.items])

  const form = useForm<zod.infer<typeof ReceiveReturnSchema>>({
    defaultValues: {
      items: previewItems
        ?.sort((i1, i2) => i1.id.localeCompare(i2.id))
        .map((i) => ({
          item_id: i.id,
        })),
      send_notification: false,
    },
    resolver: zodResolver(ReceiveReturnSchema),
  })

  useEffect(() => {
    previewItems
      ?.sort((i1, i2) => i1.id.localeCompare(i2.id))
      .forEach((item, index) => {
        const receivedAction = (item as any).actions?.find(
          (a: any) => a.action === "RECEIVE_RETURN_ITEM"
        )
        const dismissedAction = (item as any).actions?.find(
          (a: any) => a.action === "RECEIVE_DAMAGED_RETURN_ITEM"
        )

        form.setValue(
          `items.${index}.quantity`,
          receivedAction?.details.quantity,
          { shouldTouch: true, shouldDirty: true }
        )
        form.setValue(
          `items.${index}.dismissed_quantity`,
          dismissedAction?.details.quantity,
          { shouldTouch: true, shouldDirty: true }
        )
      })
  }, [previewItems])

  /**
   * HANDLERS
   */

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (!orderReturn?.id || !order?.id) {
        toast.error("Missing return or order data")
        return
      }

      // Check if return needs a location assignment
      if (needsLocationAssignment && defaultLocation) {
        console.log("🔍 Assigning default location to return:", {
          returnId: orderReturn.id,
          locationId: defaultLocation.id,
          locationName: defaultLocation.name
        })
        
        // Update return with default location before confirming
        await updateReturn({
          location_id: defaultLocation.id
        })
        
        toast.success("Return location assigned", {
          description: `Assigned to ${defaultLocation.name}`,
          dismissable: true,
        })
      } else if (!orderReturn.location_id && (!stock_locations || stock_locations.length === 0)) {
        toast.error("No stock locations available", {
          description: "Cannot receive return without a stock location. Please create a stock location first.",
          dismissable: true,
        })
        return
      }
      
      // Step 1: Begin receive (creates order change)
      console.log('🔍 Step 1: Beginning receive return...')
      console.log('   Return location_id:', orderReturn.location_id)
      console.log('   Default location:', defaultLocation?.id)
      
      await fetchQuery(`/vendor/returns/${orderReturn.id}/receive`, {
        method: 'POST',
        body: {
          internal_note: data.internal_note || undefined,
          description: data.description || undefined
        }
      })
      
      console.log('✅ Step 1 complete: Order change created')
      
      // Step 2: Confirm receive (completes order change & triggers refund)
      console.log('🔍 Step 2: Confirming receive return...')
      await confirmReturnReceive({ no_notification: !data.send_notification })
      
      console.log('✅ Step 2 complete: Return received, refund will be processed')

      handleSuccess(`/orders/${order.id}`)

      toast.success(t("general.success"), {
        description: t("orders.returns.receive.toast.success"),
        dismissible: true,
      })
    } catch (e) {
      toast.error(t("general.error"), {
        description: (e as Error).message,
        dismissible: true,
      })
    }
  })

  const handleQuantityChange = async (
    itemId: string,
    value: number | null,
    index: number
  ) => {
    const item = previewItems?.find((i) => i.id === itemId)
    if (!item) return
    const action = (item as any)?.actions?.find(
      (a: any) => a.action === "RECEIVE_RETURN_ITEM"
    )

    if (typeof value === "number" && value < 0) {
      form.setValue(
        `items.${index}.quantity`,
        item.detail.return_received_quantity,
        { shouldTouch: true, shouldDirty: true }
      )

      toast.error(t("orders.returns.receive.toast.errorNegativeValue"))

      return
    }

    if (typeof value === "number" && value > item.quantity) {
      // reset value in the form and notify the user to be aware that we didn't chang anything

      form.setValue(
        `items.${index}.quantity`,
        item.detail.return_received_quantity,
        { shouldTouch: true, shouldDirty: true }
      )

      toast.error(t("orders.returns.receive.toast.errorLargeValue"))

      return
    }

    try {
      if (action) {
        if (value === null || value === 0) {
          await removeReceiveItem(action.id)

          return
        }

        await updateReceiveItem({ actionId: action.id, quantity: value })
      } else {
        if (typeof value === "number" && value > 0 && value <= item.quantity) {
          await addReceiveItems({ items: [{ id: item.id, quantity: value }] })
        }
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const onFormClose = async (isSubmitSuccessful: boolean) => {
    try {
      if (!isSubmitSuccessful) {
        await cancelReceiveReturn()
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <RouteDrawer.Form form={form} onClose={onFormClose}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex size-full flex-col overflow-auto">
          <div className="flex flex-col gap-y-8 p-6">
            {needsLocationAssignment && defaultLocation && (
              <Alert>
                <Text size="small">
                  This return will be assigned to <strong>{defaultLocation.name}</strong> location automatically.
                </Text>
              </Alert>
            )}
            
            {!orderReturn.location_id && (!stock_locations || stock_locations.length === 0) && (
              <Alert variant="error">
                <Text size="small">
                  <strong>No stock locations available.</strong> Please create a stock location before receiving returns.
                </Text>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                  <Text size="small" leading="compact" weight="plus">
                    {t("orders.returns.receive.location")}
                  </Text>
                </div>
                <Text size="small" leading="compact">
                  {stock_location?.name || defaultLocation?.name || t("general.na")}
                </Text>
              </div>
              <span className="text-ui-fg-muted txt-small text-right">
                {t("orders.returns.receive.itemsLabel")}
              </span>
            </div>
            {previewItems.map((item, ind) => {
              const originalItem = itemsMap[item.id]

              return (
                <div
                  key={item.id}
                  className="bg-ui-bg-subtle shadow-elevation-card-rest mt-2 rounded-xl"
                >
                  <div className="flex flex-col items-center gap-x-2 gap-y-2 p-3 text-sm md:flex-row">
                    <div className="flex flex-1 items-center gap-x-3">
                      <Text size="small" className="text-ui-fg-subtle">
                        {item.quantity}x
                      </Text>

                      <Thumbnail src={item.thumbnail} />
                      <div className="flex flex-col">
                        <div>
                          <Text className="txt-small" as="span" weight="plus">
                            {item.title}{" "}
                          </Text>
                          {originalItem.variant_sku && (
                            <span>({originalItem.variant_sku})</span>
                          )}
                        </div>
                        <Text as="div" className="text-ui-fg-subtle txt-small">
                          {originalItem.product_title}
                        </Text>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-row items-center gap-2">
                      <DismissedQuantity
                        form={form}
                        item={item}
                        index={ind}
                        returnId={orderReturn.id}
                        orderId={order.id}
                      />
                      <Form.Field
                        control={form.control}
                        name={`items.${ind}.quantity`}
                        render={({ field: { onChange, value, ...field } }) => {
                          return (
                            <Form.Item className="w-full">
                              <Form.Control>
                                <Input
                                  min={0}
                                  max={item.quantity}
                                  type="number"
                                  value={value ?? ""}
                                  className="bg-ui-bg-field-component text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === ""
                                        ? null
                                        : parseFloat(e.target.value)

                                    onChange(value)
                                  }}
                                  {...field}
                                  onBlur={() => {
                                    field.onBlur()
                                    handleQuantityChange(item.id, value ?? null, ind)
                                  }}
                                />
                              </Form.Control>
                            </Form.Item>
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* TOTALS*/}
            <div className="my-6 border-b border-t border-dashed py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="txt-small text-ui-fg-subtle">
                  {t("fields.total")}
                </span>
                <span className="txt-small text-ui-fg-subtle">
                  {getStylizedAmount(preview.total, order.currency_code)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dotted pt-4">
                <span className="txt-small font-medium">
                  {t("orders.returns.outstandingAmount")}
                </span>
                <span className="txt-small font-medium">
                  {getStylizedAmount(
                    preview?.summary?.pending_difference || 0,
                    order.currency_code
                  )}
                </span>
              </div>
            </div>

            <Alert className="rounded-xl" variant="warning">
              {t("orders.returns.receive.inventoryWarning")}
            </Alert>

            <div className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl p-3">
              <Form.Field
                control={form.control}
                name="send_notification"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item>
                      <div className="flex items-center gap-3">
                        <Form.Control>
                          <Switch
                            className="mt-1 self-start"
                            checked={!!value}
                            onCheckedChange={onChange}
                            {...field}
                          />
                        </Form.Control>
                        <div className="flex flex-col">
                          <Form.Label>
                            {t("orders.returns.sendNotification")}
                          </Form.Label>
                          <Form.Hint className="!mt-1">
                            {t("orders.returns.receive.sendNotificationHint")}
                          </Form.Hint>
                        </div>
                      </div>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="overflow-hidden">
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={false}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
