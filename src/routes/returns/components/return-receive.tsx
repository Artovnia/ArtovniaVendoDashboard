import { useState } from "react"
import { Button, Container, Heading, Text, toast, Prompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { fetchQuery } from "../../../lib/client"
import { useReturns } from "../../../hooks/api/returns"
import { queryClient } from "../../../lib/query-client"
import { returnsQueryKeys } from "../../../hooks/api/returns"

interface ReturnReceiveProps {
  returnRequest: any
  onSuccess: () => void
}

export const ReturnReceive = ({ returnRequest, onSuccess }: ReturnReceiveProps) => {
  const { t } = useTranslation()
  const [isReceiving, setIsReceiving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Query Medusa returns for this order using existing seller-return link
  const { returns, isLoading: isLoadingReturns } = useReturns({
    order_id: returnRequest.order?.id,
    fields: 'id,status,order_id'
  })

  console.log('🔍 [RETURN-RECEIVE] Component state:', {
    returnRequestOrderId: returnRequest.order?.id,
    returnsFromHook: returns,
    returnsCount: returns?.length,
    isLoadingReturns
  })

  const medusaReturn = returns?.[0] // Get the first (should be only one) return for this order
  const isReceived = medusaReturn?.status === 'received'
  
  console.log('🔍 [RETURN-RECEIVE] Medusa return:', {
    medusaReturn,
    isReceived,
    hasReturnId: !!medusaReturn?.id
  })

  const handleReceiveClick = () => {
    setShowConfirmation(true)
  }

  const handleConfirmReceive = async () => {
    setShowConfirmation(false)
  
    
    if (!medusaReturn?.id) {
      toast.error(t('requests.returns.returnDetail.noReturnFound'))
      return
    }

    setIsReceiving(true)
    try {
      
      // Fetch full return data to get items
      const fullReturn = await fetchQuery(`/vendor/returns/${medusaReturn.id}?fields=id,items.*,items.item_id,items.quantity`, {
        method: 'GET'
      })
      
      
      // Handle both array and object response formats
      const returnData = Array.isArray(fullReturn.return) ? fullReturn.return[0] : fullReturn.return
      const returnItems = returnData?.items || []
      
      if (returnItems.length === 0) {
        toast.error(t('requests.returns.returnDetail.noItemsFound'))
        return
      }
      
      // Prepare items for receive workflow
      // CRITICAL FIX: Use RETURN ITEM ID (item.id), NOT order line item ID!
      // receiveItemReturnRequestWorkflow expects return item IDs (retitem_xxx)
      const itemsToReceive = returnItems.map((item: any) => ({
        id: item.id,  // ✅ Return item ID (retitem_...)
        quantity: item.quantity
      }))
      
      
      
      // Step 1: Begin receive (creates order change structure WITH items)
      // CRITICAL: Pass items here to create return item actions in order_change
      await fetchQuery(`/vendor/returns/${medusaReturn.id}/receive`, {
        method: 'POST',
        body: {
          items: itemsToReceive  // Items MUST be included here!
        }
      })
      
      
      
      // Step 2: Mark items as received
      // CRITICAL: This step updates received_quantity!
      await fetchQuery(`/vendor/returns/${medusaReturn.id}/receive-items`, {
        method: 'POST',
        body: {
          items: itemsToReceive
        }
      })
      
      // Step 3: Confirm receive
      await fetchQuery(`/vendor/returns/${medusaReturn.id}/receive/confirm`, {
        method: 'POST',
        body: { no_notification: false }
      })
      
      
      
      // Invalidate all return queries to force refresh
      await queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      
      // Wait a bit for cache to update
      await new Promise(resolve => setTimeout(resolve, 300))
      
      toast.success(t('requests.returns.returnDetail.itemsReceivedSuccess'))
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || t('requests.returns.returnDetail.itemsReceivedError'))
    } finally {
      setIsReceiving(false)
    }
  }

  if (isReceived) {
    return (
      <Container className="p-6 bg-ui-bg-subtle-success">
        <Heading level="h2" className="mb-2">{t('requests.returns.returnDetail.step2Title')}</Heading>
        <Text className="text-ui-fg-success">✓ {t('requests.returns.returnDetail.itemsReceived')}</Text>
      </Container>
    )
  }

  return (
    <>
      <Container className="p-6">
        <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.step2Title')}</Heading>
        
        <div className="space-y-4">
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-sm">
              {t('requests.returns.returnDetail.receiveInstructions')}
            </Text>
          </div>

          {/* Show items to be received */}
          {returnRequest.line_items && returnRequest.line_items.length > 0 && (
            <div className="border border-ui-border-base rounded-lg p-4">
              <Text className="text-sm font-medium mb-3">{t('requests.returns.returnDetail.itemsToReceive')}:</Text>
              <div className="space-y-2">
                {returnRequest.line_items.map((returnItem: any) => {
                  const orderItem = returnRequest.order?.items?.find((i: any) => i.id === returnItem.line_item_id)
                  return (
                    <div key={returnItem.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-ui-tag-blue-icon flex-shrink-0"></div>
                        <Text className="font-medium">
                          {orderItem?.variant?.product?.title || orderItem?.title || "Unknown Item"}
                        </Text>
                        {orderItem?.variant?.title && orderItem.variant.title !== "Default Title" && (
                          <Text className="text-ui-fg-subtle">({orderItem.variant.title})</Text>
                        )}
                      </div>
                      <Text className="text-ui-fg-subtle">{t('requests.returns.returnDetail.quantity')}: {returnItem.quantity}</Text>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleReceiveClick}
            disabled={isReceiving}
            className="w-full"
            variant="primary"
          >
            {isReceiving ? t('requests.returns.returnDetail.processing') : t('requests.returns.returnDetail.confirmItemsReceived')}
          </Button>
        </div>
      </Container>

      <Prompt open={showConfirmation}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>{t('requests.returns.returnDetail.confirmReceiveTitle')}</Prompt.Title>
            <Prompt.Description>
              {t('requests.returns.returnDetail.confirmReceiveMessage')}
              {returnRequest.line_items && returnRequest.line_items.length > 0 && (
                <div className="mt-4 space-y-1">
                  {returnRequest.line_items.map((returnItem: any) => {
                    const orderItem = returnRequest.order?.items?.find((i: any) => i.id === returnItem.line_item_id)
                    return (
                      <div key={returnItem.id} className="text-sm">
                        • {orderItem?.variant?.product?.title || orderItem?.title || "Unknown Item"} ({t('requests.returns.returnDetail.quantity')}: {returnItem.quantity})
                      </div>
                    )
                  })}
                </div>
              )}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setShowConfirmation(false)}>
              {t('common.cancel')}
            </Prompt.Cancel>
            <Prompt.Action onClick={handleConfirmReceive}>
              {t('requests.returns.returnDetail.confirmReceive')}
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </>
  )
}
