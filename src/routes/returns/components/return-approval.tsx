import { useState } from "react"
import { Button, Heading, Label, Select, Textarea, Prompt, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useUpdateVendorReturnRequest } from "../../../hooks/api/return-requests"

interface ReturnApprovalProps {
  returnRequest: any
  onSuccess: () => void
}

export const ReturnApproval = ({ returnRequest, onSuccess }: ReturnApprovalProps) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState<"approved" | "withdrawn" | "escalated">("approved")
  const [note, setNote] = useState<string>("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateReturnRequest } = useUpdateVendorReturnRequest()

  const handleSubmit = async () => {
    if (status === "approved") {
      setShowConfirmation(true)
      return
    }

    await handleConfirmApproval()
  }

  const handleConfirmApproval = async () => {
    setShowConfirmation(false)
    setIsSubmitting(true)
    
    try {
      await updateReturnRequest(returnRequest.id, {
        status: status as "approved" | "withdrawn" | "escalated",
        vendor_reviewer_note: note
      })
      toast.success(t('requests.returns.returnDetail.approvalSuccess'))
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || t('requests.returns.returnDetail.updateError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
        <Heading level="h2" className="mb-4">{t('requests.returns.returnDetail.step1Title')}</Heading>
        
        <div className="space-y-4">
          <div>
            <Label>{t('requests.returns.returnDetail.decision')}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "approved" | "withdrawn" | "escalated")}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="approved">{t('requests.returns.returnDetail.approveReturn')}</Select.Item>
                <Select.Item value="withdrawn">{t('requests.returns.returnDetail.rejectReturn')}</Select.Item>
                <Select.Item value="escalated">{t('requests.returns.returnDetail.escalateToAdmin')}</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label>{t('requests.returns.returnDetail.vendorNote')}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('requests.returns.returnDetail.vendorNotePlaceholder')}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!note.trim() || isSubmitting}
            className="w-full"
            variant="primary"
          >
            {status === "approved" ? t('requests.returns.returnDetail.approveReturn') : t('requests.returns.returnDetail.submitDecision')}
          </Button>
        </div>

      <Prompt open={showConfirmation}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>{t('requests.returns.returnDetail.confirmApprovalTitle')}</Prompt.Title>
            <Prompt.Description>
              {t('requests.returns.returnDetail.confirmApprovalMessage')}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setShowConfirmation(false)}>
              {t('common.cancel')}
            </Prompt.Cancel>
            <Prompt.Action onClick={handleConfirmApproval}>
              {t('requests.returns.returnDetail.confirmApproval')}
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </>
  )
}
