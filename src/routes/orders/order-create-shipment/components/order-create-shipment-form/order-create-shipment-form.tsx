import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { useState, useRef } from "react"

import { AdminFulfillment, AdminOrder } from "@medusajs/types"
import { Button, Heading, Input, Switch, toast } from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"

import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateOrderShipment } from "../../../../../hooks/api"
import { CreateShipmentSchema } from "./constants"
import { uploadInvoiceQuery, fetchQuery } from "../../../../../lib/client/client"
import { queryClient } from "../../../../../lib/query-client"
import { ordersQueryKeys } from "../../../../../hooks/api/orders"

type OrderCreateFulfillmentFormProps = {
  order: AdminOrder
  fulfillments: AdminFulfillment[]
}

export function OrderCreateShipmentForm({
  order,
  fulfillments,
}: OrderCreateFulfillmentFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [uploadedInvoice, setUploadedInvoice] = useState<{
    url: string
    name: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the first fulfillment for the mutation hook (we'll loop through all in handleSubmit)
  const primaryFulfillment = fulfillments[0]
  const { mutateAsync: createShipment, isPending: isMutating } =
    useCreateOrderShipment(order.id, primaryFulfillment?.id)

  const form = useForm<zod.infer<typeof CreateShipmentSchema>>({
    defaultValues: {
      send_notification: !order.no_notification,
      labels: [{ tracking_number: "", carrier: "" }],
      invoice_url: "",
      invoice_name: "",
    },
    resolver: zodResolver(CreateShipmentSchema),
  })

  const { fields: labels, append, remove } = useFieldArray({
    name: "labels",
    control: form.control,
  })

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Just pass the file, no need for order/fulfillment IDs
      const data = await uploadInvoiceQuery(file)

      setUploadedInvoice({ url: data.url, name: data.name })
      form.setValue("invoice_url", data.url)
      form.setValue("invoice_name", data.name)
      toast.success(t("orders.shipment.invoiceUploadSuccess"))
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while uploading the invoice"
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveInvoice = () => {
    setUploadedInvoice(null)
    form.setValue("invoice_url", "")
    form.setValue("invoice_name", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Create shipments for ALL fulfillments in the group
      for (const fulfillment of fulfillments) {
        await fetchQuery(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
          {
            method: 'POST',
            body: {
              items: (fulfillment as any).items?.map((i: any) => ({
                id: i.line_item_id,
                quantity: i.quantity,
              })),
              labels: data.labels
                .filter((l) => !!l.tracking_number)
                .map((l) => ({
                  tracking_number: l.tracking_number,
                  tracking_url: "#",
                  label_url: "#",
                })),
              shipping_carrier: data.labels[0]?.carrier || "",
              invoice_url: data.invoice_url || undefined,
              invoice_name: data.invoice_name || undefined,
            },
          }
        );
      }

      // Invalidate order queries to refresh the UI with updated shipment status
      await queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(order.id),
      });
      await queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lists(),
      });

      toast.success(
        fulfillments.length > 1 
          ? `${fulfillments.length} shipments created successfully`
          : t("orders.shipment.toastCreated")
      );
      handleSuccess(`/orders/${order.id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isMutating}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="flex h-full w-full flex-col items-center divide-y overflow-y-auto">
          <div className="flex size-full flex-col items-center overflow-auto p-16">
            <div className="flex w-full max-w-[736px] flex-col justify-center px-2 pb-2">
              <div className="flex flex-col divide-y">
                <div className="flex flex-1 flex-col">
                  <Heading className="mb-4">
                    {t("orders.shipment.title")}
                  </Heading>

                  {labels.map((label, index) => (
                    <div key={label.id} className="mb-6 p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Heading className="text-sm">
                          {t("orders.shipment.parcelLabel")} {index + 1}
                        </Heading>
                        {index > 0 && (
                          <Button
                            type="button"
                            size="small"
                            variant="secondary"
                            onClick={() => remove(index)}
                          >
                            {t("actions.remove")}
                          </Button>
                        )}
                      </div>
                      
                      <Form.Field
                        control={form.control}
                        name={`labels.${index}.tracking_number`}
                        render={({ field }) => {
                          return (
                            <Form.Item className="mb-3">
                              <Form.Label>
                                {t("orders.shipment.trackingNumber")}
                              </Form.Label>
                              <Form.Control>
                                <Input {...field} placeholder="123-456-789" />
                              </Form.Control>
                              <Form.ErrorMessage />
                            </Form.Item>
                          )
                        }}
                      />
                      
                      <Form.Field
                        control={form.control}
                        name={`labels.${index}.carrier`}
                        render={({ field }) => {
                          return (
                            <Form.Item>
                              <Form.Label>
                                {t("orders.shipment.shippingCarrier")}
                              </Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  placeholder={t("orders.shipment.shippingCarrierPlaceholder")}
                                />
                              </Form.Control>
                              <Form.ErrorMessage />
                            </Form.Item>
                          )
                        }}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={() => append({ tracking_number: "", carrier: "" })}
                    className="self-end"
                    variant="secondary"
                  >
                    {t("orders.shipment.addTracking")}
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <Heading level="h3" className="mb-4">
                    {t("orders.shipment.invoiceTitle")}
                  </Heading>
                  <p className="text-sm text-gray-600 mb-4">
                    {t("orders.shipment.invoiceDescription")}
                  </p>

                  {!uploadedInvoice ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                        id="invoice-upload"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        disabled={isUploading}
                      >
                        {isUploading
                          ? t("orders.shipment.invoiceUploading")
                          : t("orders.shipment.invoiceSelectFile")}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        {t("orders.shipment.invoiceAllowedFormats")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3  rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {uploadedInvoice.name}
                        </p>
                        <a
                          href={uploadedInvoice.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {t("orders.shipment.invoicePreview")}
                        </a>
                      </div>
                      <Button
                        type="button"
                        onClick={handleRemoveInvoice}
                        variant="secondary"
                        size="small"
                      >
                        {t("orders.shipment.invoiceRemove")}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8">
                  <Form.Field
                    control={form.control}
                    name="send_notification"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex items-center justify-between">
                            <Form.Label>
                              {t("orders.shipment.sendNotification")}
                            </Form.Label>
                            <Form.Control>
                              <Switch
                                checked={!!value}
                                onCheckedChange={onChange}
                                {...field}
                              />
                            </Form.Control>
                          </div>
                          <Form.Hint className="!mt-1">
                            {t("orders.shipment.sendNotificationHint")}
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
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}