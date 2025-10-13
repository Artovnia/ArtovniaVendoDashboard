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
import { RefundConfirmationModal } from "./refund-confirmation-modal"

// Status badges configuration for return requests
const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case "pending":
      return <Badge color="orange">{t('requests.returns.status.pending')}</Badge>
    case "approved":
      return <Badge color="green">{t('requests.returns.status.approved')}</Badge>
    case "refunded":
      return <Badge color="green">{t('requests.returns.status.refunded')}</Badge>
    case "escalated":
      return <Badge color="red">{t('requests.returns.status.escalated')}</Badge>
    case "withdrawn":
      return <Badge color="grey">{t('requests.returns.status.withdrawn')}</Badge>
    default:
      return <Badge color="grey">{status}</Badge>
  }
}

// Find proper item name from order items
const getItemName = (returnItem: any, returnRequest: any, t: any) => {
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
      return orderItem.title || `${t('requests.returns.returnDetail.itemName')} ${returnItem.line_item_id.substring(0, 8)}`
    }
  }
  
  return `${t('requests.returns.returnDetail.itemName')} ${returnItem.line_item_id.substring(0, 8)}`
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
  
  // State for refund modal
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundStatus, setRefundStatus] = useState<'not_refunded' | 'refunded' | 'checking'>('checking')
  
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
  
  // Check refund status when return request loads
  useEffect(() => {
    // For now, disable automatic refund status check
    // This requires a different approach to fetch payment refunds
    setRefundStatus('not_refunded')
  }, [return_request])
  
  if (isLoading) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>{t('requests.returns.returnDetail.title')}</Heading>
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
          <Heading>{t('requests.returns.returnDetail.empty')}</Heading>
        </RouteDrawer.Header>
        <div className="flex h-full w-full items-center justify-center">
          <Text>{t('requests.returns.returnDetail.error')}</Text>
        </div>
      </RouteDrawer>
    )
  }

  const canUpdate = return_request.status === "pending"

  const onSubmit = async (data: FormValues) => {
    if (!id) return
    
    // If status is "refunded", show confirmation modal first
    if (data.status === 'refunded') {
      // Store form data for later submission
      form.setValue('status', data.status)
      form.setValue('vendor_reviewer_note', data.vendor_reviewer_note)
      setShowRefundModal(true)
      return
    }
    
    // For other statuses (withdrawn, escalated), submit directly
    setIsSubmitting(true)
    
    try {
      await updateReturnRequest(id, {
        status: data.status,
        vendor_reviewer_note: data.vendor_reviewer_note,
      })
      
      toast.success(t('requests.returns.returnDetail.statusUpdated'), {
        duration: 3000,
        action: {
          label: "Ok",
          onClick: () => {},
          altText: t('requests.returns.returnDetail.confirmationAlt'),
        },
      })
      
      refetch()
      navigate("/requests/returns")
    } catch (error: any) {
      toast.error(error.message || t('requests.returns.returnDetail.errorUpdating'), {
        duration: 5000,
        action: {
          label: t('requests.returns.returnDetail.retryAlt'),
          onClick: () => {},
          altText: t('requests.returns.returnDetail.retryAlt'),
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
        <Heading>{t('requests.returns.returnDetail.title')} #{return_request.id.substring(0, 8)}</Heading>
      </RouteDrawer.Header>
      <RouteDrawer.Body className="flex flex-col gap-y-8 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.customerInfo')}</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.name')}</Text>
                <Text className="font-medium">
                  {return_request.order?.customer ? `${return_request.order.customer.first_name} ${return_request.order.customer.last_name}` : "-"}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.email')}</Text>
                <Text className="font-medium">{return_request.order?.customer?.email || "-"}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.orderNumber')}</Text>
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
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.orderId')}</Text>
                <Text className="font-medium">{return_request.order?.id.substring(0, 8) || "-"}</Text>
              </div>
            </div>
          </div>
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.returnDetails')}</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.status')}</Text>
                <div>{getStatusBadge(return_request.status, t)}</div>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.createdAt')}</Text>
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
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.customerNote')}</Text>
                <Text className="font-medium">{return_request.customer_note || "-"}</Text>
              </div>
            </div>
          </div>
        </div>

        {hasReturnReasons && (
          <div>
            <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.returnItems')}</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('requests.returns.returnDetail.itemName')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('requests.returns.returnDetail.reason')}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">{t('requests.returns.returnDetail.quantity')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {return_request.line_items?.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>{getItemName(item, return_request, t)}</Table.Cell>
                    <Table.Cell>
                      {item.reason_id ? (
                        returnReasons.find(reason => reason.id === item.reason_id)?.label || 
                        `${t('requests.returns.returnDetail.reasonFallback')} #${item.reason_id.substring(0, 8)}`
                      ) : t('requests.returns.returnDetail.reasonNotProvided')}
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
              <Heading level="h2">{t('requests.returns.returnDetail.updateStatus')}</Heading>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">{t('requests.returns.returnDetail.status')}</label>
                <Select
                  onValueChange={(value) => form.setValue("status", value as "refunded" | "withdrawn" | "escalated")}
                  defaultValue={"refunded"}
                >
                  <Select.Trigger>
                    <Select.Value placeholder={t('requests.returns.returnDetail.selectStatus')} />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="refunded">{t('requests.returns.returnDetail.refunded')}</Select.Item>
                    <Select.Item value="withdrawn">{t('requests.returns.returnDetail.withdrawn')}</Select.Item>
                    <Select.Item value="escalated">{t('requests.returns.returnDetail.escalated')}</Select.Item>
                  </Select.Content>
                </Select>
                <input type="hidden" {...register("status", { required: true })} />
                {errors.status && (
                  <p className="text-ui-fg-error text-xs mt-1">{t('requests.returns.returnDetail.statusRequired')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="vendor_reviewer_note" className="text-sm font-medium">{t('requests.returns.returnDetail.note')}</label>
                <Textarea
                  placeholder={t('requests.returns.returnDetail.addNote')}
                  {...register("vendor_reviewer_note", { required: true })}
                />
                {errors.vendor_reviewer_note && (
                  <p className="text-ui-fg-error text-xs mt-1">{t('requests.returns.returnDetail.noteRequired')}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/requests/returns")}
                >
                  {t('requests.returns.returnDetail.cancel')}
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {t('requests.returns.returnDetail.saveChanges')}
                </Button>
              </div>
            </form>
        )}
        
        {!canUpdate && return_request.status === 'refunded' && refundStatus === 'not_refunded' && (
          <div className="flex flex-col gap-y-4 pt-8 border-t border-ui-border-base">
            <Heading level="h2">{t('requests.returns.returnDetail.processRefund')}</Heading>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <Text className="font-semibold text-yellow-900 mb-1">
                    {t('requests.returns.returnDetail.refundPendingTitle')}
                  </Text>
                  <Text className="text-sm text-yellow-800">
                    {t('requests.returns.returnDetail.refundPendingMessage')}
                  </Text>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={() => setShowRefundModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('requests.returns.returnDetail.refundCustomer')}
              </Button>
              <Text className="text-sm text-ui-fg-subtle">
                {t('requests.returns.returnDetail.refundNote')}
              </Text>
            </div>
          </div>
        )}
        
        {!canUpdate && refundStatus === 'refunded' && (
          <div className="flex flex-col gap-y-4 pt-8 border-t border-ui-border-base">
            <Heading level="h2">{t('requests.returns.returnDetail.refundCompleted')}</Heading>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-xl">✅</div>
                <div className="flex-1">
                  <Text className="font-semibold text-green-900 mb-1">
                    {t('requests.returns.returnDetail.refundSuccessTitle')}
                  </Text>
                  <Text className="text-sm text-green-800">
                    {t('requests.returns.returnDetail.refundSuccessMessage')}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!canUpdate && (
          <div className="flex flex-col gap-y-4 pt-8 border-t border-ui-border-base">
            <Heading level="h2">{t('requests.returns.returnDetail.vendorResponse')}</Heading>
            
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.status')}</Text>
                <div>{getStatusBadge(return_request.status, t)}</div>
              </div>
              {return_request.vendor_reviewer_note && (
                <div>
                  <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.note')}</Text>
                  <Text className="font-medium">{return_request.vendor_reviewer_note || "-"}</Text>
                </div>
              )}
              <div>
                <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.updatedAt')}</Text>
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
                {t('requests.returns.returnDetail.backToList')}
              </Button>
            </div>
          </div>
        )}
      </RouteDrawer.Body>
      
      {showRefundModal && (
        <RefundConfirmationModal
          returnId={id!}
          returnAmount={return_request?.order?.total}
          currencyCode={return_request?.order?.currency_code}
          vendorNote={form.getValues('vendor_reviewer_note')}
          onSuccess={() => {
            setShowRefundModal(false)
            setRefundStatus('refunded')
            refetch()
            navigate("/requests/returns")
          }}
          onCancel={() => setShowRefundModal(false)}
        />
      )}
    </RouteDrawer>
  )
}
