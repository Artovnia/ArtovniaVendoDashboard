import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { fetchQuery } from "../../../../lib/client"

interface RefundConfirmationModalProps {
  returnId: string
  returnAmount?: number
  currencyCode?: string
  vendorNote: string
  onSuccess: () => void
  onCancel: () => void
}

export const RefundConfirmationModal: React.FC<RefundConfirmationModalProps> = ({
  returnId,
  returnAmount,
  currencyCode = "PLN",
  vendorNote,
  onSuccess,
  onCancel
}) => {
  const { t } = useTranslation('translation', { useSuspense: false })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    
    try {
      console.log('🔍 Frontend: Updating return request status to refunded:', returnId)
      
      // First, update the return request status to "refunded"
      const response = await fetchQuery(`/vendor/return-request/${returnId}`, {
        method: 'POST',
        body: {
          status: 'refunded',
          vendor_reviewer_note: vendorNote
        }
      })
      
      console.log('✅ Frontend: Return request updated:', response)
      
      toast.success(t('requests.returns.returnDetail.statusUpdated'), {
        duration: 5000,
        action: {
          label: "Ok",
          onClick: () => {},
          altText: t('requests.returns.returnDetail.confirmationAlt'),
        },
      })
      
      onSuccess()
    } catch (error: any) {
      console.error('❌ Frontend: Update failed:', error)
      
      toast.error(error.message || t('requests.returns.returnDetail.errorUpdating'), {
        duration: 7000,
        action: {
          label: t('requests.returns.returnDetail.retryAlt'),
          onClick: () => {},
          altText: t('requests.returns.returnDetail.retryAlt'),
        },
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-ui-border-base">
          <Heading level="h2" className="text-ui-fg-base">
            {t('requests.returns.returnDetail.refundConfirmTitle')}
          </Heading>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 text-2xl">⚠️</div>
              <div className="flex-1">
                <Text className="font-semibold text-orange-900 mb-2">
                  {t('requests.returns.returnDetail.refundWarningTitle')}
                </Text>
                <Text className="text-sm text-orange-800">
                  {t('requests.returns.returnDetail.refundWarningMessage')}
                </Text>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Text className="text-sm text-ui-fg-subtle">
              {t('requests.returns.returnDetail.refundConfirmMessage')}
            </Text>
            
            {returnAmount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Text className="font-medium text-blue-900">
                    {t('requests.returns.returnDetail.refundAmount')}:
                  </Text>
                  <Text className="text-xl font-bold text-blue-900">
                    {(returnAmount / 100).toFixed(2)} {currencyCode}
                  </Text>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <Text className="text-xs text-gray-600">
                {t('requests.returns.returnDetail.refundProcessNote')}
              </Text>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ui-border-base flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {t('requests.returns.returnDetail.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isProcessing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('requests.returns.returnDetail.confirmRefund')}
          </Button>
        </div>
      </div>
    </div>
  )
}
