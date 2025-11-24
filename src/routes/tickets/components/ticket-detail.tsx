import { Badge, Button, Container, Heading, Label, Select, Textarea, toast } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, PaperClip } from '@medusajs/icons'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  useVendorTicket,
  useUpdateVendorTicket,
  useAddVendorTicketMessage,
} from '../../../hooks/api/tickets'

type TicketDetailProps = {
  ticketId: string
}

export const TicketDetail = ({ ticketId }: TicketDetailProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ticket, isLoading, isError } = useVendorTicket(ticketId)
  const { updateTicket } = useUpdateVendorTicket()
  const { addMessage, isPending: isAddingMessage } = useAddVendorTicketMessage()

  const [newMessage, setNewMessage] = useState('')
  const [messageFiles, setMessageFiles] = useState<File[]>([])

  if (isLoading) {
    return (
      <Container className='p-6'>
        <div>{t('common.loading', 'Loading...')}</div>
      </Container>
    )
  }

  if (isError || !ticket) {
    return (
      <Container className='p-6'>
        <div>{t('tickets.notFound', 'Ticket not found')}</div>
      </Container>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTicket({
        id: ticketId,
        data: { status: newStatus as any },
      })
      toast.success(t('tickets.statusUpdated', 'Status updated'))
    } catch (error: any) {
      toast.error(error.message || t('tickets.updateError', 'Failed to update'))
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateTicket({
        id: ticketId,
        data: { priority: newPriority as any },
      })
      toast.success(t('tickets.priorityUpdated', 'Priority updated'))
    } catch (error: any) {
      toast.error(error.message || t('tickets.updateError', 'Failed to update'))
    }
  }

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error(t('tickets.messageRequired', 'Message is required'))
      return
    }

    try {
      await addMessage({
        ticketId,
        data: {
          content: newMessage,
          files: messageFiles,
        },
      })

      setNewMessage('')
      setMessageFiles([])
      toast.success(t('tickets.messageSent', 'Message sent'))
    } catch (error: any) {
      toast.error(error.message || t('tickets.messageSendError', 'Failed to send message'))
    }
  }

  const getStatusColor = (status: string): 'blue' | 'orange' | 'purple' | 'green' | 'grey' => {
    const colorMap = {
      open: 'blue',
      in_progress: 'orange',
      waiting_customer: 'purple',
      resolved: 'green',
      closed: 'grey',
    } as const
    return colorMap[status as keyof typeof colorMap] || 'grey'
  }

  const getPriorityColor = (priority: string): 'red' | 'orange' | 'blue' | 'grey' => {
    const colorMap = {
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'grey',
    } as const
    return colorMap[priority as keyof typeof colorMap] || 'grey'
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Header */}
      <Container className='p-6'>
        <Button
          variant='transparent'
          onClick={() => navigate('/tickets')}
          className='mb-4 -ml-2'
        >
          <ArrowLeft />
          {t('common.back', 'Back')}
        </Button>

        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <Heading level='h1'>{ticket.ticket_number}</Heading>
              <Badge size='small' color={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge size='small' color={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
            <Heading level='h2' className='text-ui-fg-subtle font-normal'>
              {ticket.title}
            </Heading>
          </div>
        </div>

        <div className='mt-6 grid grid-cols-2 gap-4'>
          <div>
            <Label>{t('tickets.form.status', 'Status')}</Label>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value='open'>
                  {t('tickets.status.open', 'Open')}
                </Select.Item>
                <Select.Item value='in_progress'>
                  {t('tickets.status.inProgress', 'In Progress')}
                </Select.Item>
                <Select.Item value='waiting_customer'>
                  {t('tickets.status.waitingCustomer', 'Waiting')}
                </Select.Item>
                <Select.Item value='resolved'>
                  {t('tickets.status.resolved', 'Resolved')}
                </Select.Item>
                <Select.Item value='closed'>
                  {t('tickets.status.closed', 'Closed')}
                </Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label>{t('tickets.form.priority', 'Priority')}</Label>
            <Select value={ticket.priority} onValueChange={handlePriorityChange}>
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
        </div>

        <div className='mt-6'>
          <Label>{t('tickets.form.description', 'Description')}</Label>
          <div className='mt-2 p-4 bg-ui-bg-subtle rounded-md whitespace-pre-wrap'>
            {ticket.description}
          </div>
        </div>

        <div className='mt-4 text-xs text-ui-fg-subtle'>
          {t('tickets.created', 'Created')}: {new Intl.DateTimeFormat('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(ticket.created_at)}
        </div>
      </Container>

      {/* Messages */}
      <Container className='p-6'>
        <Heading level='h2' className='mb-4'>
          {t('tickets.messages', 'Messages')} ({ticket.messages?.length || 0})
        </Heading>

        <div className='space-y-4'>
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((message) => (
              <div
                key={message.id}
                className='p-4 border border-ui-border-base rounded-md'
              >
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <span className='font-medium'>{message.author_name}</span>
                    <Badge size='small' className='ml-2'>
                      {message.author_type === 'admin' ? t('tickets.admin', 'Admin') : t('tickets.you', 'You')}
                    </Badge>
                  </div>
                  <span className='text-xs text-ui-fg-subtle'>
                    {new Intl.DateTimeFormat('pl-PL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(message.created_at)}
                  </span>
                </div>
                <div className='whitespace-pre-wrap text-ui-fg-base'>
                  {message.content}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className='mt-3 pt-3 border-t space-y-2'>
                    {message.attachments.map((attachment: any) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 text-sm text-ui-fg-interactive hover:underline'
                      >
                        <PaperClip className='w-4 h-4' />
                        {attachment.original_filename}
                        <span className='text-xs text-ui-fg-subtle'>
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className='text-center py-8 text-ui-fg-subtle'>
              {t('tickets.noMessages', 'No messages yet')}
            </div>
          )}
        </div>

        {/* Add Message Form */}
        <form onSubmit={handleAddMessage} className='mt-6 pt-6 border-t'>
          <Label>{t('tickets.addMessage', 'Add Message')}</Label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('tickets.messagePlaceholder', 'Type your message...')}
            rows={4}
            className='mt-2'
            required
          />

          <div className='mt-4'>
            <Label>{t('tickets.form.attachments', 'Attachments (Optional)')}</Label>
            <input
              type='file'
              multiple
              accept='image/*,.pdf,.doc,.docx'
              onChange={(e) => setMessageFiles(Array.from(e.target.files || []))}
              className='w-full px-3 py-2 border border-ui-border-base rounded-md text-sm mt-2'
            />
            {messageFiles.length > 0 && (
              <p className='text-xs text-ui-fg-subtle mt-1'>
                {messageFiles.length} {t('tickets.form.filesSelected', 'file(s) selected')}
              </p>
            )}
          </div>

          <div className='flex justify-end mt-4'>
            <Button type='submit' disabled={isAddingMessage || !newMessage.trim()}>
              {isAddingMessage ? t('common.sending', 'Sending...') : t('tickets.sendMessage', 'Send Message')}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}
