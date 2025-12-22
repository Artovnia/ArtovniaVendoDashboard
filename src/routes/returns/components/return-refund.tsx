import { useState, useEffect } from "react"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useReturns } from "../../../hooks/api/returns"
import { fetchQuery } from "../../../lib/client"
import { toast } from "@medusajs/ui"
import { queryClient } from "../../../lib/query-client"
import { vendorReturnRequestsQueryKeys } from "../../../hooks/api/return-requests"

interface ReturnRefundProps {
  returnRequest: any
  onSuccess: () => void
}

export const ReturnRefund = ({ returnRequest, onSuccess }: ReturnRefundProps) => {
  const { t } = useTranslation()
  const [refundStatus, setRefundStatus] = useState<'checking' | 'pending' | 'completed'>('checking')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasRefundInDatabase, setHasRefundInDatabase] = useState<boolean | null>(null)

  const { returns } = useReturns({
    fields: 'id,status,refund_amount,order_id'
  })

  const medusaReturn = returns?.find((r: any) => r.order_id === returnRequest.order?.id)

  useEffect(() => {
    if (returnRequest?.status === 'refunded') {
      setHasRefundInDatabase(true)
      return
    }

    if (medusaReturn?.status === 'received') {
      setHasRefundInDatabase(true)
      return
    }

    if (returnRequest?.order?.payment_status === 'refunded' || 
        returnRequest?.order?.payment_status === 'partially_refunded') {
      setHasRefundInDatabase(true)
      return
    }

    setHasRefundInDatabase(false)
  }, [returnRequest?.status, medusaReturn?.status, returnRequest?.order?.payment_status])

  useEffect(() => {
    if (hasRefundInDatabase === true) {
      setRefundStatus('completed')
      return
    }

    if (returnRequest?.status === 'refunded') {
      setRefundStatus('completed')
      return
    }

    const paymentStatus = returnRequest?.order?.payment_status
    if (paymentStatus === 'refunded' || paymentStatus === 'partially_refunded') {
      setRefundStatus('completed')
      return
    }

    const paymentCollection = returnRequest?.order?.payment_collection
    if (paymentCollection?.payments) {
      const hasRefunds = paymentCollection.payments.some((payment: any) => 
        payment.refunds && payment.refunds.length > 0
      )
      if (hasRefunds) {
        setRefundStatus('completed')
        return
      }
    }

    if (medusaReturn?.status === 'received' || medusaReturn?.status === 'partially_received') {
      setRefundStatus('pending')
      return
    }

    setRefundStatus('checking')
  }, [medusaReturn, returnRequest, hasRefundInDatabase])

  const handleManualRefund = async () => {
    if (refundStatus === 'completed') {
      toast.warning("Refund has already been processed for this return")
      return
    }

    const returnId = medusaReturn?.id || returns?.[0]?.id
    
    if (!returnId) {
      toast.error("No return found to refund. Check console for details.")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetchQuery(`/vendor/returns/${returnId}/refund`, {
        method: 'POST'
      })
      
      if (response?.message?.includes('already') || response?.error?.includes('already')) {
        toast.warning(t('requests.returns.returnDetail.refundAlreadyProcessed'))
        
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.lists() 
        })
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.details() 
        })
        onSuccess()
        return
      }
      
      await queryClient.invalidateQueries({ 
        queryKey: vendorReturnRequestsQueryKeys.lists() 
      })
      await queryClient.invalidateQueries({ 
        queryKey: vendorReturnRequestsQueryKeys.details() 
      })
      
      toast.success(t('requests.returns.returnDetail.refundProcessedSuccess'))
      
      onSuccess()
      
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.lists() 
        })
        queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.details() 
        })
      }, 1000)
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('already') || 
          error.message?.toLowerCase().includes('refunded')) {
        toast.warning(t('requests.returns.returnDetail.refundAlreadyProcessed'))
        
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.lists() 
        })
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.details() 
        })
        onSuccess()
      } else {
        toast.error(error.message || t('requests.returns.returnDetail.refundProcessError'))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (refundStatus === 'completed') {
    return (
      <Container className="p-6 bg-ui-bg-subtle-success">
        <Heading level="h2" className="mb-2">{t('requests.returns.returnDetail.step3Title')}</Heading>
        <div className="flex items-center gap-2">
          <Badge color="green">{t('requests.returns.returnDetail.refundCompleted')}</Badge>
          <Text className="text-sm">{t('requests.returns.returnDetail.refundSuccessMessage')}</Text>
        </div>
      </Container>
    )
  }

  if (refundStatus === 'pending') {
    return (
      <Container className="p-6 bg-ui-bg-subtle-warning">
        <Heading level="h2" className="mb-2">{t('requests.returns.returnDetail.step3Title')}</Heading>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge color="orange">{t('requests.returns.returnDetail.refundPending')}</Badge>
              <Text className="text-sm">{t('requests.returns.returnDetail.awaitingReceipt')}</Text>
            </div>
            <Text className="text-xs text-ui-fg-subtle">
              {t('requests.returns.returnDetail.refundAutomatic')}
            </Text>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleManualRefund}
              disabled={isProcessing}
              variant="secondary"
              size="small"
            >
              {isProcessing ? t('common.processing') : t('requests.returns.returnDetail.retryRefund')}
            </Button>
            <Text className="text-xs text-ui-fg-subtle mt-2">
              {t('requests.returns.returnDetail.retryRefundHint')}
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <Heading level="h2" className="mb-2">{t('requests.returns.returnDetail.step3Title')}</Heading>
      <div className="space-y-4">
        <Text className="text-sm text-ui-fg-subtle">{t('requests.returns.returnDetail.checkingRefundStatus')}</Text>
      </div>
    </Container>
  )
}