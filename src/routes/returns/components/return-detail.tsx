import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useVendorReturnRequest } from "../../../hooks/api/return-requests"
import { useDate } from "../../../hooks/use-date"
import { fetchReturnReasons } from "../../../services/return-reasons"
import { ReturnApproval } from "./return-approval"
import { ReturnReceive } from "./return-receive"
import { ReturnRefund } from "./return-refund"
import { Thumbnail } from "../../../components/common/thumbnail"

interface ReturnDetailProps {
  returnId: string
}

const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "pending":
      return <Badge color="orange" size="large">{t('requests.returns.status.pending')}</Badge>
    case "approved":
      return <Badge color="blue" size="large">{t('requests.returns.status.approved')}</Badge>
    case "refunded":
      return <Badge color="green" size="large">{t('requests.returns.status.refunded')}</Badge>
    case "escalated":
      return <Badge color="red" size="large">{t('requests.returns.status.escalated')}</Badge>
    case "withdrawn":
      return <Badge color="grey" size="large">{t('requests.returns.status.withdrawn')}</Badge>
    default:
      return <Badge color="grey" size="large">{status}</Badge>
  }
}

export const ReturnDetail = ({ returnId }: ReturnDetailProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getFullDate } = useDate()
  const { return_request, isLoading, refetch } = useVendorReturnRequest(returnId)
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({})

  // Fetch return reasons
  useEffect(() => {
    const loadReturnReasons = async () => {
      try {
        const reasons = await fetchReturnReasons()
        const reasonMap: Record<string, string> = {}
        reasons.forEach((reason: any) => {
          reasonMap[reason.id] = reason.label
        })
        setReturnReasons(reasonMap)
      } catch (error) {
        console.error("Error loading return reasons:", error)
      }
    }
    loadReturnReasons()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Text size="base">Loading...</Text>
      </div>
    )
  }

  if (!return_request) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Text size="base">Return request not found</Text>
      </div>
    )
  }

  const isPending = return_request.status === "pending"
  const isApproved = return_request.status === "refunded" || return_request.status === "approved"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-ui-border-base bg-ui-bg-subtle p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="transparent" onClick={() => navigate("/returns")}>
              ← {t('requests.returns.returnDetail.backToReturns')}
            </Button>
            <Heading level="h1">
              {t('requests.returns.returnDetail.heading')}{return_request.order?.display_id || "-"}
            </Heading>
            {getStatusBadge(return_request.status, t)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Return Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Container className="p-6">
              <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.customerInformation')}</Heading>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-ui-fg-subtle text-sm">{t('requests.returns.returnDetail.name')}</Text>
                  <Text className="font-medium">
                    {return_request.order?.customer 
                      ? `${return_request.order.customer.first_name} ${return_request.order.customer.last_name}`
                      : "-"}
                  </Text>
                </div>
                <div>
                  <Text className="text-ui-fg-subtle text-sm">{t('requests.returns.returnDetail.email')}</Text>
                  <Text className="font-medium">{return_request.order?.customer?.email || "-"}</Text>
                </div>
                <div>
                  <Text className="text-ui-fg-subtle text-sm">{t('requests.returns.returnDetail.orderNumber')}</Text>
                  <Link to={`/orders/${return_request.order?.id}`} className="font-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover">
                    #{return_request.order?.display_id || "-"}
                  </Link>
                </div>
                <div>
                  <Text className="text-ui-fg-subtle text-sm">{t('requests.returns.returnDetail.requestDate')}</Text>
                  <Text className="font-medium">
                    {return_request.created_at 
                      ? getFullDate({ date: new Date(return_request.created_at), includeTime: true })
                      : "-"}
                  </Text>
                </div>
              </div>
            </Container>

            {/* Return Items */}
            <Container className="p-6">
              <Heading level="h2" className="mb-4">
                {t('requests.returns.returnDetail.returnItems')}
                <span className="text-sm font-normal text-ui-fg-subtle ml-2">
                  ({return_request.line_items?.length || 0} of {return_request.order?.items?.length || 0} {t('requests.returns.returnDetail.itemsRequested')})
                </span>
              </Heading>
              <div className="space-y-4">
                {return_request.line_items?.map((returnItem) => {
                  const orderItem = return_request.order?.items?.find(i => i.id === returnItem.line_item_id)
                  const productId = orderItem?.variant?.product?.id
                  const variantId = orderItem?.variant?.id
                  const productLink = productId && variantId ? `/products/${productId}/variants/${variantId}` : null
                  const thumbnail = orderItem?.variant?.product?.thumbnail || orderItem?.thumbnail
                  
                  const ItemContent = (
                    <div className="flex gap-4 border border-ui-border-base rounded-lg p-4 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover transition-colors">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full rounded overflow-hidden">
                          <Thumbnail src={thumbnail} alt={orderItem?.variant?.product?.title || orderItem?.title} />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Text className="font-semibold text-base truncate">
                              {orderItem?.variant?.product?.title || orderItem?.title || "Unknown Item"}
                            </Text>
                            {orderItem?.variant?.title && orderItem.variant.title !== "Default Title" && (
                              <Text className="text-sm text-ui-fg-subtle">
                                {t('requests.returns.returnDetail.variant')}: {orderItem.variant.title}
                              </Text>
                            )}
                            <div className="flex gap-4 mt-2">
                              <Text className="text-sm">
                                <span className="text-ui-fg-subtle">{t('requests.returns.returnDetail.quantity')}:</span>{" "}
                                <span className="font-medium">{returnItem.quantity}</span>
                                {orderItem?.quantity && returnItem.quantity !== orderItem.quantity && (
                                  <span className="text-ui-fg-subtle"> / {orderItem.quantity} {t('requests.returns.returnDetail.ordered')}</span>
                                )}
                              </Text>
                            </div>
                          </div>

                          {/* Return Reason Badge */}
                          <div className="flex-shrink-0">
                            <div className="bg-ui-bg-base border border-ui-border-base rounded px-3 py-1">
                              <Text className="text-xs text-ui-fg-subtle uppercase">{t('requests.returns.returnDetail.reason')}</Text>
                              <Text className="text-sm font-medium">
                                {returnItem.reason_id ? (returnReasons[returnItem.reason_id] || returnItem.reason_id) : "-"}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                  
                  return productLink ? (
                    <Link key={returnItem.id} to={productLink} className="block">
                      {ItemContent}
                    </Link>
                  ) : (
                    <div key={returnItem.id}>
                      {ItemContent}
                    </div>
                  )
                })}
              </div>

              {/* Show non-returned items if partial return */}
              {return_request.order?.items && 
               return_request.line_items && 
               return_request.order.items.length > return_request.line_items.length && (
                <div className="mt-6 pt-6 border-t border-ui-border-base">
                  <Text className="text-sm font-medium text-ui-fg-subtle mb-3">
                    {t('requests.returns.returnDetail.itemsNotReturned')} ({return_request.order.items.length - return_request.line_items.length}):
                  </Text>
                  <div className="space-y-2">
                    {return_request.order.items
                      .filter(orderItem => !return_request.line_items?.some(ri => ri.line_item_id === orderItem.id))
                      .map(orderItem => (
                        <div key={orderItem.id} className="flex items-center gap-3 text-sm text-ui-fg-muted pl-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-ui-fg-muted flex-shrink-0"></span>
                          <Text className="text-sm">
                            {orderItem.variant?.product?.title || orderItem.title}
                            {orderItem.variant?.title && orderItem.variant.title !== "Default Title" && (
                              <span className="text-ui-fg-subtle"> - {orderItem.variant.title}</span>
                            )}
                            <span className="text-ui-fg-subtle"> ({t('requests.returns.returnDetail.quantity')}: {orderItem.quantity})</span>
                          </Text>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Container>

            {/* Customer Note */}
            {return_request.customer_note && (
              <Container className="p-6">
                <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.customerNote')}</Heading>
                <Text>{return_request.customer_note}</Text>
              </Container>
            )}

            {/* Vendor Response */}
            {return_request.vendor_reviewer_note && (
              <Container className="p-6">
                <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.vendorResponse')}</Heading>
                <Text>{return_request.vendor_reviewer_note}</Text>
                {return_request.vendor_review_date && (
                  <Text className="text-sm text-ui-fg-subtle mt-2">
                    {t('requests.returns.returnDetail.reviewedOn')}: {getFullDate({ date: new Date(return_request.vendor_review_date), includeTime: true })}
                  </Text>
                )}
              </Container>
            )}

            {/* Admin Response */}
            {return_request.admin_reviewer_note && (
              <Container className="p-6 bg-ui-bg-subtle">
                <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.adminResponse')}</Heading>
                <Text>{return_request.admin_reviewer_note}</Text>
                {return_request.admin_review_date && (
                  <Text className="text-sm text-ui-fg-subtle mt-2">
                    {t('requests.returns.returnDetail.adminReviewedOn')}: {getFullDate({ date: new Date(return_request.admin_review_date), includeTime: true })}
                  </Text>
                )}
              </Container>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Step 1: Approval */}
            {isPending && (
              <ReturnApproval 
                returnRequest={return_request}
                onSuccess={() => {
                  refetch()
                  toast.success("Return request updated successfully")
                }}
              />
            )}

            {/* Step 2: Receive Items */}
            {isApproved && (
              <ReturnReceive 
                returnRequest={return_request}
                onSuccess={() => {
                  refetch()
                  toast.success("Items received successfully")
                }}
              />
            )}

            {/* Step 3: Process Refund */}
            {isApproved && (
              <ReturnRefund 
                returnRequest={return_request}
                onSuccess={() => {
                  refetch()
                  toast.success("Refund processed successfully")
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
