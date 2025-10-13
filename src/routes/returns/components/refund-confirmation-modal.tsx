import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { fetchQuery } from "../../../lib/client"

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
      const response = await fetchQuery(`/vendor/return-request/${returnId}`, {
        method: 'POST',
        body: {
          status: 'approved',
          vendor_reviewer_note: vendorNote
        }
      })
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ui-bg-overlay">
      <div className="bg-ui-bg-base rounded-lg shadow-elevation-modal max-w-md w-full mx-4 border border-ui-border-base">
        <div className="p-6 border-b border-ui-border-base">
          <Heading level="h2" className="text-ui-fg-base">
            {t('requests.returns.returnDetail.refundConfirmTitle')}
          </Heading>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-ui-bg-subtle-hover border border-ui-border-base rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-ui-fg-interactive text-2xl">⚠️</div>
              <div className="flex-1">
                <Text className="font-semibold text-ui-fg-base mb-2">
                  {t('requests.returns.returnDetail.refundWarningTitle')}
                </Text>
                <Text className="text-sm text-ui-fg-subtle">
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
              <div className="bg-ui-bg-field border border-ui-border-base rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Text className="font-medium text-ui-fg-base">
                    {t('requests.returns.returnDetail.refundAmount')}:
                  </Text>
                  <Text className="text-xl font-bold text-ui-fg-base">
                    {(returnAmount / 100).toFixed(2)} {currencyCode}
                  </Text>
                </div>
              </div>
            )}

            <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4 mt-4">
              <Text className="text-xs text-ui-fg-muted">
                {t('requests.returns.returnDetail.refundProcessNote')}
              </Text>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-ui-border-base flex gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            disabled={isProcessing}
          >
            {t('requests.returns.returnDetail.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? t('requests.returns.returnDetail.processing') : t('requests.returns.returnDetail.confirmRefund')}
          </Button>
        </div>
      </div>
    </div>
  )
}
