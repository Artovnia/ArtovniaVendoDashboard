import { Container, Heading, Badge, Button } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { Plus } from '@medusajs/icons'
import { useState } from 'react'

import { _DataTable } from '../../../components/table/data-table/data-table'
import { useVendorTickets } from '../../../hooks/api/tickets'
import { useDataTable } from '../../../hooks/use-data-table'
import { CreateTicketModal } from './create-ticket-modal'

const PAGE_SIZE = 20

const useTicketTableColumns = () => {
  const { t } = useTranslation()

  return [
    {
      accessorKey: 'ticket_number',
      header: t('tickets.table.ticketNumber', 'Ticket #') as string,
      cell: ({ row }: any) => (
        <span className='font-medium'>{row.original.ticket_number}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: t('tickets.table.title', 'Title') as string,
      cell: ({ row }: any) => (
        <div className='max-w-[300px] truncate'>{row.original.title}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('tickets.table.type', 'Type') as string,
      cell: ({ row }: any) => {
        const typeLabels: Record<string, string> = {
          support: t('tickets.types.support', 'Support') as string,
          bug_report: t('tickets.types.bugReport', 'Bug Report') as string,
          feature_request: t('tickets.types.featureRequest', 'Feature Request') as string,
          other: t('tickets.types.other', 'Other') as string,
        }
        return <span>{typeLabels[row.original.type] || row.original.type}</span>
      },
    },
    {
      accessorKey: 'status',
      header: t('tickets.table.status', 'Status') as string,
      cell: ({ row }: any) => {
        const status = row.original.status
        const colorMap: Record<string, 'blue' | 'orange' | 'purple' | 'green' | 'grey'> = {
          open: 'blue',
          in_progress: 'orange',
          waiting_customer: 'purple',
          resolved: 'green',
          closed: 'grey',
        }
        const statusLabels: Record<string, string> = {
          open: t('tickets.status.open', 'Open') as string,
          in_progress: t('tickets.status.inProgress', 'In Progress') as string,
          waiting_customer: t('tickets.status.waitingCustomer', 'Waiting') as string,
          resolved: t('tickets.status.resolved', 'Resolved') as string,
          closed: t('tickets.status.closed', 'Closed') as string,
        }
        return (
          <Badge size='small' color={colorMap[status] || 'grey'}>
            {statusLabels[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: t('tickets.table.priority', 'Priority') as string,
      cell: ({ row }: any) => {
        const priority = row.original.priority
        const colorMap: Record<string, 'red' | 'orange' | 'blue' | 'grey'> = {
          urgent: 'red',
          high: 'orange',
          medium: 'blue',
          low: 'grey',
        }
        const priorityLabels: Record<string, string> = {
          urgent: t('tickets.priority.urgent', 'Urgent') as string,
          high: t('tickets.priority.high', 'High') as string,
          medium: t('tickets.priority.medium', 'Medium') as string,
          low: t('tickets.priority.low', 'Low') as string,
        }
        return (
          <Badge size='small' color={colorMap[priority] || 'grey'}>
            {priorityLabels[priority] || priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: t('tickets.table.created', 'Created') as string,
      cell: ({ row }: any) => {
        const date = row.original.created_at
        return date ? new Intl.DateTimeFormat('pl-PL', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date) : '-'
      },
    },
  ]
}

const useTicketTableFilters = () => {
  const { t } = useTranslation()

  return [
    {
      key: 'status',
      label: t('tickets.filters.status', 'Status') as string,
      type: 'select' as const,
      options: [
        { label: t('tickets.status.open', 'Open') as string, value: 'open' },
        { label: t('tickets.status.inProgress', 'In Progress') as string, value: 'in_progress' },
        { label: t('tickets.status.waitingCustomer', 'Waiting') as string, value: 'waiting_customer' },
        { label: t('tickets.status.resolved', 'Resolved') as string, value: 'resolved' },
        { label: t('tickets.status.closed', 'Closed') as string, value: 'closed' },
      ],
    },
    {
      key: 'type',
      label: t('tickets.filters.type', 'Type') as string,
      type: 'select' as const,
      options: [
        { label: t('tickets.types.support', 'Support') as string, value: 'support' },
        { label: t('tickets.types.bugReport', 'Bug Report') as string, value: 'bug_report' },
        { label: t('tickets.types.featureRequest', 'Feature Request') as string, value: 'feature_request' },
        { label: t('tickets.types.other', 'Other') as string, value: 'other' },
      ],
    },
  ]
}

export const TicketsList = () => {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [queryParams, setQueryParams] = useState<{
    limit: number
    offset: number
    status?: string
    type?: string
    order?: string
    q?: string
  }>({
    limit: PAGE_SIZE,
    offset: 0,
  })

  const { tickets, count, isError, error, isLoading } = useVendorTickets(queryParams as any)

  const filters = useTicketTableFilters()
  const columns = useTicketTableColumns()

  const { table } = useDataTable({
    data: tickets ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <>
      <Container className='divide-y p-0'>
        <div className='flex items-center justify-between px-6 py-4'>
          <Heading>{t('tickets.title', 'Support Tickets')}</Heading>
          <Button size='small' variant='secondary' onClick={() => setCreateModalOpen(true)}>
            <Plus />
            {t('tickets.createNew', 'New Ticket')}
          </Button>
        </div>
        <_DataTable
          columns={columns}
          table={table}
          pagination
          navigateTo={(row) => `/tickets/${row.original.id}`}
          filters={filters}
          count={count}
          search
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            {
              key: 'created_at',
              label: t('tickets.table.created', 'Created'),
            },
            {
              key: 'status',
              label: t('tickets.table.status', 'Status'),
            },
            {
              key: 'priority',
              label: t('tickets.table.priority', 'Priority'),
            },
          ]}
          queryObject={{} as any}
          noRecords={{
            message: t('tickets.noTickets', 'No tickets found'),
          }}
        />
      </Container>

      <CreateTicketModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
        }}
      />
    </>
  )
}
