import { Button, FocusModal, Input, Label, Select, Textarea, toast } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useCreateVendorTicket } from '../../../hooks/api/tickets'

type CreateTicketModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const CreateTicketModal = ({ open, onClose, onSuccess }: CreateTicketModalProps) => {
  const { t } = useTranslation()
  const { createTicket, isPending } = useCreateVendorTicket()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'support' as 'support' | 'bug_report' | 'feature_request' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  })
  const [files, setFiles] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createTicket({
        ...formData,
        files,
      })

      toast.success(t('tickets.createSuccess', 'Ticket created successfully'))
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'support',
        priority: 'medium',
      })
      setFiles([])

      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || t('tickets.createError', 'Failed to create ticket'))
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Content className='max-w-2xl mx-auto my-auto'>
        <FocusModal.Header>
          <FocusModal.Title>{t('tickets.createNew', 'Create New Ticket')}</FocusModal.Title>
        </FocusModal.Header>

        <form onSubmit={handleSubmit}>
          <FocusModal.Body className='space-y-6 px-6 py-4'>
          <div>
            <Label>
              {t('tickets.form.type', 'Type')} <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value='support'>
                  {t('tickets.types.support', 'Support')}
                </Select.Item>
                <Select.Item value='bug_report'>
                  {t('tickets.types.bugReport', 'Bug Report')}
                </Select.Item>
                <Select.Item value='feature_request'>
                  {t('tickets.types.featureRequest', 'Feature Request')}
                </Select.Item>
                <Select.Item value='other'>
                  {t('tickets.types.other', 'Other')}
                </Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label>
              {t('tickets.form.priority', 'Priority')}
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value='low'>
                  {t('tickets.priority.low', 'Low')}
                </Select.Item>
                <Select.Item value='medium'>
                  {t('tickets.priority.medium', 'Medium')}
                </Select.Item>
                <Select.Item value='high'>
                  {t('tickets.priority.high', 'High')}
                </Select.Item>
                <Select.Item value='urgent'>
                  {t('tickets.priority.urgent', 'Urgent')}
                </Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label>
              {t('tickets.form.title', 'Title')} <span className='text-red-500'>*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('tickets.form.titlePlaceholder', 'Brief description of the issue')}
              required
              minLength={5}
              maxLength={200}
            />
            <p className='text-xs text-ui-fg-subtle mt-1'>
              {formData.title.length}/200 (minimum 5)
            </p>
          </div>

          <div>
            <Label>
              {t('tickets.form.description', 'Description')} <span className='text-red-500'>*</span>
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('tickets.form.descriptionPlaceholder', 'Detailed description of your issue...')}
              required
              minLength={20}
              maxLength={5000}
              rows={6}
            />
            <p className='text-xs text-ui-fg-subtle mt-1'>
              {formData.description.length}/5000 (minimum 20)
            </p>
          </div>

          <div>
            <Label>{t('tickets.form.attachments', 'Attachments (Optional)')}</Label>
            <input
              type='file'
              multiple
              accept='image/*,.pdf,.doc,.docx'
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className='w-full px-3 py-2 border border-ui-border-base rounded-md text-sm'
            />
            {files.length > 0 && (
              <p className='text-xs text-ui-fg-subtle mt-1'>
                {files.length} {t('tickets.form.filesSelected', 'file(s) selected')}
              </p>
            )}
            <p className='text-xs text-ui-fg-subtle mt-1'>
              {t('tickets.form.attachmentsHint', 'Max 5 files, 10MB each')}
            </p>
          </div>

          </FocusModal.Body>

          <FocusModal.Footer className='px-6 py-4'>
            <div className='flex items-center justify-end gap-2'>
              <Button type='button' variant='secondary' onClick={onClose} disabled={isPending}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type='submit' disabled={isPending || formData.title.length < 5 || formData.description.length < 20}>
                {isPending ? t('common.creating', 'Creating...') : t('tickets.create', 'Create Ticket')}
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}
