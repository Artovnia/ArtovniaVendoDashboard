import { Container, Heading } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'

import { _DataTable } from '../../../components/table/data-table/data-table'
import { useVendorReturnRequests } from '../../../hooks/api/return-requests'
import { useReturnRequestTableColumns } from '../../../hooks/table/columns/use-return-request-table-columns'
import { useReturnRequestTableFilters } from '../../../hooks/table/filters/use-return-request-table-filters'
import { useReturnRequestTableQuery } from '../../../hooks/table/query/use-return-request-table-query'
import { useDataTable } from '../../../hooks/use-data-table'

const PAGE_SIZE = 20

export const ReturnsList = () => {
  const { t } = useTranslation()
  const { raw, searchParams } = useReturnRequestTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { return_requests, count, isError, error, isLoading } =
    useVendorReturnRequests({
      ...searchParams,
    })

  const filters = useReturnRequestTableFilters()
  const columns = useReturnRequestTableColumns()

  const { table } = useDataTable({
    data: return_requests ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>{t('requests.returns.title')}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/returns/${row.original.id}`}
        filters={filters}
        count={count}
        search
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          {
            key: 'created_at',
            label: t('requests.returns.table.date'),
          },
          {
            key: 'status',
            label: t('fields.status'),
          },
        ]}
        queryObject={raw}
        noRecords={{
          message: t('requests.returns.noRequests'),
        }}
      />
    </Container>
  )
}
