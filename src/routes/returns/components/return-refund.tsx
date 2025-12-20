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

  // Query all returns and find the one for this order
  const { returns } = useReturns({
    fields: 'id,status,refund_amount,order_id'
  })

  // Find the return that matches this order
  const medusaReturn = returns?.find((r: any) => r.order_id === returnRequest.order?.id)

  // Check for refunds based on return status
  useEffect(() => {
    console.log('🔍 [RETURN-REFUND] Checking refund indicators:', {
      returnRequestStatus: returnRequest?.status,
      medusaReturnStatus: medusaReturn?.status,
      orderPaymentStatus: returnRequest?.order?.payment_status
    })

    // If return request status is 'refunded', mark as completed
    if (returnRequest?.status === 'refunded') {
      console.log('✅ [RETURN-REFUND] Return request status is refunded')
      setHasRefundInDatabase(true)
      return
    }

    // If medusa return status is 'received', refund should have been processed
    // (based on backend workflow that processes refund after receiving items)
    if (medusaReturn?.status === 'received') {
      console.log('✅ [RETURN-REFUND] Medusa return is received, refund should be processed')
      setHasRefundInDatabase(true)
      return
    }

    // If order payment status indicates refund
    if (returnRequest?.order?.payment_status === 'refunded' || 
        returnRequest?.order?.payment_status === 'partially_refunded') {
      console.log('✅ [RETURN-REFUND] Order payment status indicates refund')
      setHasRefundInDatabase(true)
      return
    }

    // Otherwise, no refund detected yet
    console.log('❌ [RETURN-REFUND] No refund indicators found')
    setHasRefundInDatabase(false)
  }, [returnRequest?.status, medusaReturn?.status, returnRequest?.order?.payment_status])

  useEffect(() => {
    console.log('🔍 [RETURN-REFUND] Checking refund status:', {
      returnRequestStatus: returnRequest?.status,
      medusaReturnStatus: medusaReturn?.status,
      orderPaymentStatus: returnRequest?.order?.payment_status,
      hasPaymentCollection: !!returnRequest?.order?.payment_collection,
      hasRefundInDatabase: hasRefundInDatabase
    })

    // Primary check: Direct database refund check
    if (hasRefundInDatabase === true) {
      console.log('✅ [RETURN-REFUND] Status: completed (direct database check)')
      setRefundStatus('completed')
      return
    }

    // Secondary check: return request status = 'refunded'
    if (returnRequest?.status === 'refunded') {
      console.log('✅ [RETURN-REFUND] Status: completed (return request status)')
      setRefundStatus('completed')
      return
    }

    // Secondary check: order payment status = 'refunded' or 'partially_refunded'
    const paymentStatus = returnRequest?.order?.payment_status
    if (paymentStatus === 'refunded' || paymentStatus === 'partially_refunded') {
      console.log('✅ [RETURN-REFUND] Status: completed (payment status)')
      setRefundStatus('completed')
      return
    }

    // Tertiary check: Check payment_collection for refunds directly
    const paymentCollection = returnRequest?.order?.payment_collection
    if (paymentCollection?.payments) {
      const hasRefunds = paymentCollection.payments.some((payment: any) => 
        payment.refunds && payment.refunds.length > 0
      )
      if (hasRefunds) {
        console.log('✅ [RETURN-REFUND] Status: completed (has refunds in payment collection)')
        setRefundStatus('completed')
        return
      }
    }

    // If return is received, awaiting refund
    if (medusaReturn?.status === 'received' || medusaReturn?.status === 'partially_received') {
      console.log('⏳ [RETURN-REFUND] Status: pending (return received)')
      setRefundStatus('pending')
      return
    }

    console.log('❓ [RETURN-REFUND] Status: checking')
    setRefundStatus('checking')
  }, [medusaReturn, returnRequest, hasRefundInDatabase])

  // 🔧 DEVELOPMENT: Manual refund trigger
  const handleManualRefund = async () => {
    // Check if refund already processed
    if (refundStatus === 'completed') {
      toast.warning("Refund has already been processed for this return")
      return
    }

    // Try to get return ID from multiple sources
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
      
      // Check if response indicates refund was already processed
      if (response?.message?.includes('already') || response?.error?.includes('already')) {
        toast.warning(t('requests.returns.returnDetail.refundAlreadyProcessed'))
        
        // Still refresh data to update UI
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.lists() 
        })
        await queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.details() 
        })
        onSuccess()
        return
      }
      
      // Invalidate ALL return request queries (lists AND details)
      await queryClient.invalidateQueries({ 
        queryKey: vendorReturnRequestsQueryKeys.lists() 
      })
      await queryClient.invalidateQueries({ 
        queryKey: vendorReturnRequestsQueryKeys.details() 
      })
      
      toast.success(t('requests.returns.returnDetail.refundProcessedSuccess'))
      
      // Call onSuccess which triggers parent refetch
      onSuccess()
      
      // Force a small delay to ensure backend has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.lists() 
        })
        queryClient.invalidateQueries({ 
          queryKey: vendorReturnRequestsQueryKeys.details() 
        })
      }, 1000)
    } catch (error: any) {
      console.error('❌ Refund failed:', error)
      
      // Check if error message indicates already refunded
      if (error.message?.toLowerCase().includes('already') || 
          error.message?.toLowerCase().includes('refunded')) {
        toast.warning(t('requests.returns.returnDetail.refundAlreadyProcessed'))
        
        // Refresh data anyway
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

          {/* Retry button for when automatic refund fails */}
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

  // Fallback: Show development button even if we can't determine status
  return (
    <Container className="p-6">
      <Heading level="h2" className="mb-2">{t('requests.returns.returnDetail.step3Title')}</Heading>
      <div className="space-y-4">
        <Text className="text-sm text-ui-fg-subtle">{t('requests.returns.returnDetail.checkingRefundStatus')}</Text>
        {/* 🔧 DEVELOPMENT ONLY: Manual refund button commented out for production */}
      </div>
    </Container>
  )
}
