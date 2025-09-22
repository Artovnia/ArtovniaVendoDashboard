import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useDate } from "../../../../hooks/use-date"
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Heading,
  Select,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useVendorReturnRequest, useUpdateVendorReturnRequest } from "../../../../hooks/api/return-requests"
import { RouteDrawer } from "../../../../components/modals"
import { fetchReturnReasons } from "../../../../services/return-reasons"

// Status badges configuration for return requests
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge color="orange">Oczekujący</Badge>
    case "approved":
      return <Badge color="green">Zatwierdzony</Badge>
    case "refunded":
      return <Badge color="green">Zwrócony</Badge>
    case "escalated":
      return <Badge color="red">Eskalowany</Badge>
    case "withdrawn":
      return <Badge color="grey">Odrzucony</Badge>
    default:
      return <Badge color="grey">{status}</Badge>
  }
}

// Find proper item name from order items
const getItemName = (returnItem: any, returnRequest: any) => {
  if (returnItem.title) {
    return returnItem.title
  }
  
  // Try to find matching item in order items using line_item_id
  if (returnRequest.order?.items) {
    const orderItem = returnRequest.order.items.find(
      (item: any) => item.id === returnItem.line_item_id
    )
    
    if (orderItem) {
      // Prefer just product name instead of variant name
      if (orderItem.variant?.product?.title) {
        return orderItem.variant.product.title
      }
      return orderItem.title || `${t('requests.returns.returnDetail.itemName', 'Item')} ${returnItem.line_item_id.substring(0, 8)}`
    }
  }
  
  return `Product ${returnItem.line_item_id.substring(0, 8)}`
}

type FormValues = {
  status: "refunded" | "withdrawn" | "escalated"
  vendor_reviewer_note: string
}

export const ReturnRequestDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getFullDate } = useDate()
  const { t } = useTranslation('translation', { useSuspense: false })
  
  const form = useForm<FormValues>({
    defaultValues: {
      status: "refunded",
      vendor_reviewer_note: "",
    },
  })
  
  const { register, handleSubmit, formState: { errors } } = form
  
  const { return_request, isLoading, refetch } = useVendorReturnRequest(id || "")
  const { updateReturnRequest } = useUpdateVendorReturnRequest()
  
  // State to hold return reasons
  const [returnReasons, setReturnReasons] = useState<{id: string, value: string, label: string}[]>([])
  
  // Fetch return reasons
  useEffect(() => {
    const getReturnReasons = async () => {
      try {
        const reasons = await fetchReturnReasons()
        setReturnReasons(reasons)
      } catch (error) {
        console.error("Error fetching return reasons:", error)
      }
    }
    
    getReturnReasons()
  }, [])
  
  // Debug date values
  console.log("Detail view return_request:", return_request?.id, "created_at:", return_request?.created_at)
  if (return_request?.created_at) {
    console.log("Detail view date type:", typeof return_request.created_at, 
              "instanceof Date:", return_request.created_at instanceof Date,
              "date string:", return_request.created_at.toString())
  }
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (isLoading) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>{t('requests.returns.returnDetail.title', 'Return Request')}</Heading>
        </RouteDrawer.Header>
        <div className="flex h-full w-full items-center justify-center">
         
        </div>
      </RouteDrawer>
    )
  }

  if (!return_request) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>{t('requests.returns.returnDetail.empty', 'No return request found')}</Heading>
        </RouteDrawer.Header>
        <div className="flex h-full w-full items-center justify-center">
          <Text>{t('requests.returns.returnDetail.error', 'Error loading return request details')}</Text>
        </div>
      </RouteDrawer>
    )
  }

  // Only allow actions on pending requests
  const canUpdate = return_request.status === "pending"

  const onSubmit = async (data: FormValues) => {
    if (!id) return
    
    setIsSubmitting(true)
    
    try {
      const updateData = {
        status: data.status as "refunded" | "withdrawn" | "escalated",
        vendor_reviewer_note: data.vendor_reviewer_note
      }
      
      await updateReturnRequest(id, updateData)
      
      toast.success(t('requests.returns.returnDetail.statusUpdated', 'Status updated successfully'), {
        duration: 2000,
        action: {
          label: "Ok",
          onClick: () => {},
          altText: "Potwierdzenie aktualizacji",
        },
      })
      
      refetch()
      navigate("/requests/returns")
    } catch (error: any) {
      toast.error(error.message || t('requests.returns.returnDetail.errorUpdating', 'Error updating status'), {
        duration: 5000,
        action: {
          label: "Spróbuj ponownie",
          onClick: () => {},
          altText: "Spróbuj ponownie",
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const hasReturnReasons = return_request.line_items && return_request.line_items.length > 0
  
  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t('requests.returns.returnDetail.title', 'Return Request')} #{return_request.id.substring(0, 8)}</Heading>
      </RouteDrawer.Header>
      <RouteDrawer.Body className="flex flex-col gap-y-8 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.customerInfo', 'Customer Information')}</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.name', 'Name')}</Text>
                <Text className="font-medium">
                  {return_request.order?.customer ? `${return_request.order.customer.first_name} ${return_request.order.customer.last_name}` : "-"}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.email', 'Email')}</Text>
                <Text className="font-medium">{return_request.order?.customer?.email || "-"}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.orderNumber', 'Order Number')}</Text>
                <Text className="font-medium">
                  {return_request.order ? (
                    <Link 
                      to={`/orders/${return_request.order.id}`}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      #{return_request.order.display_id}
                    </Link>
                  ) : `-`}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.orderId', 'Order ID')}</Text>
                <Text className="font-medium">{return_request.order?.id.substring(0, 8) || "-"}</Text>
              </div>
            </div>
          </div>
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.returnDetails', 'Return Details')}</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.status', 'Status')}</Text>
                <div>{getStatusBadge(return_request.status)}</div>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.createdAt', 'Created At')}</Text>
                <Text className="font-medium">
                  {(() => {
                    console.log("About to format date in detail view:", return_request.created_at)
                    
                    // Ensure we have a valid date
                    if (!return_request.created_at) {
                      return "-"
                    }
                    
                    // If it's already a Date object, use it
                    if (return_request.created_at instanceof Date) {
                      return getFullDate({ date: return_request.created_at, includeTime: true })
                    }
                    
                    // Otherwise convert from string
                    try {
                      const dateObj = new Date(return_request.created_at)
                      if (isNaN(dateObj.getTime())) {
                        return "-"
                      }
                      return getFullDate({ date: dateObj, includeTime: true })
                    } catch (e) {
                      console.error("Error formatting date:", e)
                      return "-"
                    }
                  })()}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.customerNote', 'Customer Note')}</Text>
                <Text className="font-medium">{return_request.customer_note || "-"}</Text>
              </div>
            </div>
          </div>
        </div>

        {hasReturnReasons && (
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.returnItems', 'Return Items')}</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('requests.returns.returnDetail.itemName', 'Item Name')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('requests.returns.returnDetail.reason', 'Reason')}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">{t('requests.returns.returnDetail.quantity', 'Quantity')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {return_request.line_items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>{getItemName(item, return_request)}</Table.Cell>
                    <Table.Cell>
                      {item.reason_id ? (
                        returnReasons.find(reason => reason.id === item.reason_id)?.label || 
                        `Przyczyna #${item.reason_id.substring(0, 8)}`
                      ) : "Nie podano przyczyny"}
                    </Table.Cell>
                    <Table.Cell className="text-right">{item.quantity}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {canUpdate && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-8 pt-8 border-t border-ui-border-base">
              <Heading level="h2">{t('requests.returns.returnDetail.updateStatus', 'Update Status')}</Heading>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">{t('requests.returns.returnDetail.status', 'Status')}</label>
                <Select
                  onValueChange={(value) => form.setValue("status", value as "refunded" | "withdrawn" | "escalated")}
                  defaultValue={"refunded"}
                >
                  <Select.Trigger>
                    <Select.Value placeholder={t('requests.returns.returnDetail.selectStatus', 'Select Status')} />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="refunded">{t('requests.returns.returnDetail.refunded', 'Refunded')}</Select.Item>
                    <Select.Item value="withdrawn">{t('requests.returns.returnDetail.withdrawn', 'Withdrawn')}</Select.Item>
                    <Select.Item value="escalated">{t('requests.returns.returnDetail.escalated', 'Escalated')}</Select.Item>
                  </Select.Content>
                </Select>
                <input type="hidden" {...register("status", { required: true })} />
                {errors.status && (
                  <p className="text-ui-fg-error text-xs mt-1">{t('requests.returns.returnDetail.statusRequired', 'Status is required')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="vendor_reviewer_note" className="text-sm font-medium">{t('requests.returns.returnDetail.note', 'Note')}</label>
                <Textarea
                  placeholder={t('requests.returns.returnDetail.addNote', 'Add a note')}
                  {...register("vendor_reviewer_note", { required: true })}
                />
                {errors.vendor_reviewer_note && (
                  <p className="text-ui-fg-error text-xs mt-1">{t('requests.returns.returnDetail.noteRequired', 'Note is required')}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/requests/returns")}
                >
                  {t('requests.returns.returnDetail.cancel', 'Cancel')}
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {t('requests.returns.returnDetail.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </form>
        )}
        
        {!canUpdate && (
          <div className="flex flex-col gap-y-4 pt-8 border-t border-ui-border-base">
            <Heading level="h2">{t('requests.returns.returnDetail.vendorResponse', 'Vendor Response')}</Heading>
            
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.status', 'Status')}</Text>
                <div>{getStatusBadge(return_request.status)}</div>
              </div>
              {return_request.vendor_reviewer_note && (
                <div>
                  <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.note', 'Note')}</Text>
                  <Text className="font-medium">{return_request.vendor_reviewer_note || "-"}</Text>
                </div>
              )}
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.updatedAt', 'Updated At')}</Text>
                <Text className="font-medium">
                  {(() => {
                    console.log("About to format vendor_review_date:", return_request.vendor_review_date)
                    
                    // Ensure we have a valid date
                    if (!return_request.vendor_review_date) {
                      return "-"
                    }
                    
                    // If it's already a Date object, use it
                    if (return_request.vendor_review_date instanceof Date) {
                      return getFullDate({ date: return_request.vendor_review_date, includeTime: true })
                    }
                    
                    // Otherwise convert from string
                    try {
                      const dateObj = new Date(return_request.vendor_review_date)
                      if (isNaN(dateObj.getTime())) {
                        return "-"
                      }
                      return getFullDate({ date: dateObj, includeTime: true })
                    } catch (e) {
                      console.error("Error formatting date:", e)
                      return "-"
                    }
                  })()}
                </Text>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate("/requests/returns")}
              >
                Powrót do listy
              </Button>
            </div>
          </div>
        )}
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
