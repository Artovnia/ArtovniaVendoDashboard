import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Checkbox,
  Heading,
  Text,
  FocusModal,
} from '@medusajs/ui'
import { ExclamationCircle } from '@medusajs/icons'

interface WatermarkWarningModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function WatermarkWarningModal({ open, onClose, onConfirm }: WatermarkWarningModalProps) {
  const { t } = useTranslation()
  const [acknowledged, setAcknowledged] = useState(false)

  const handleConfirm = () => {
    if (!acknowledged) return
    onConfirm()
    setAcknowledged(false) // Reset for next time
  }

  const handleClose = () => {
    setAcknowledged(false)
    onClose()
  }

  return (
    <FocusModal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center gap-2 p-4">
            <ExclamationCircle className="w-6 h-6 text-orange-500" />
            <Heading level="h1">
              {t('baselinker.import.watermarkWarning.title', { 
                defaultValue: 'Important: Product Images Requirements' 
              })}
            </Heading>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="space-y-4 p-4">
          {/* Main warning */}
          <div className="p-4 bg-ui-bg-subtle border border-orange-200 rounded-lg">
            <Text className="font-medium text-ui-fg-base">
              {t('baselinker.import.watermarkWarning.mainWarning', {
                defaultValue: 'All product images MUST be original (without watermarks) before import.'
              })}
            </Text>
          </div>

          {/* Detailed explanation */}
          <div className="space-y-3">
            <Text className="font-medium">
              {t('baselinker.import.watermarkWarning.requirements', {
                defaultValue: 'Image Requirements:'
              })}
            </Text>
            <ul className="space-y-2 text-sm text-ui-fg-subtle">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <Text>
                  {t('baselinker.import.watermarkWarning.requirement1', {
                    defaultValue: 'Products with watermarked images will NOT be accepted by administrators'
                  })}
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <Text>
                  {t('baselinker.import.watermarkWarning.requirement2', {
                    defaultValue: 'You must use original images from manufacturers or your own photography'
                  })}
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <Text>
                  {t('baselinker.import.watermarkWarning.requirement3', {
                    defaultValue: 'Images can be updated in BaseLinker before import, or on the platform after import'
                  })}
                </Text>
              </li>
            </ul>
          </div>

          {/* Action steps */}
          <div className="space-y-3 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <Text className="font-medium">
              {t('baselinker.import.watermarkWarning.whatToDo', {
                defaultValue: 'What to do:'
              })}
            </Text>
            <ol className="space-y-2 text-sm text-ui-fg-subtle list-decimal list-inside">
              <li>
                {t('baselinker.import.watermarkWarning.step1', {
                  defaultValue: 'Check your BaseLinker product images and replace any watermarked images with originals'
                })}
              </li>
              <li>
                {t('baselinker.import.watermarkWarning.step2', {
                  defaultValue: 'OR: Import products now and update images later in the product editor'
                })}
              </li>
              <li>
                {t('baselinker.import.watermarkWarning.step3', {
                  defaultValue: 'Products with watermarked images will be rejected during admin review'
                })}
              </li>
            </ol>
          </div>

          {/* Acknowledgment checkbox */}
          <div className="flex items-start gap-3 p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
            <Checkbox
              id="watermark-acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <label htmlFor="watermark-acknowledge" className="cursor-pointer">
              <Text className="text-sm font-medium text-ui-fg-base">
                {t('baselinker.import.watermarkWarning.acknowledge', {
                  defaultValue: 'I understand that only products with original, non-watermarked images will be approved by administrators'
                })}
              </Text>
            </label>
          </div>
        </FocusModal.Body>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-ui-border-base">
          <Button variant="secondary" onClick={handleClose}>
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!acknowledged}
          >
            {t('baselinker.import.watermarkWarning.proceed', {
              defaultValue: 'I Understand, Proceed with Import'
            })}
          </Button>
        </div>
      </FocusModal.Content>
    </FocusModal>
  )
}
