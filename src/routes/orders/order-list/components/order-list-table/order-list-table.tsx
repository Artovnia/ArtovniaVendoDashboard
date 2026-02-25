import { Container, Heading, Button } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { ArrowDownTray } from '@medusajs/icons';

import { _DataTable } from '../../../../../components/table/data-table/data-table';
import { useOrders } from '../../../../../hooks/api/orders';
import { useOrderTableColumns } from '../../../../../hooks/table/columns/use-order-table-columns';
import { useOrderTableFilters } from '../../../../../hooks/table/filters/use-order-table-filters';
import { useOrderTableQuery } from '../../../../../hooks/table/query/use-order-table-query';
import { useDataTable } from '../../../../../hooks/use-data-table';
import { DEFAULT_FIELDS } from '../../const';
import { useState } from 'react';
import { backendUrl } from '../../../../../lib/client/client';

const PAGE_SIZE = 20;

export const OrderListTable = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const { raw, searchParams } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
  });

  // Fetch all necessary fields including payment collections for correct payment status
  const { orders, count, isError, error, isLoading } =
    useOrders({
      // Use DEFAULT_FIELDS which includes payment collections
      fields: DEFAULT_FIELDS,
      ...searchParams,
    }, {
      staleTime: 30_000,
    });

  const filters = useOrderTableFilters();
  const columns = useOrderTableColumns({});

  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
  });

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Get auth token from localStorage (same as uploadFilesQuery)
      const currentToken = window.localStorage.getItem('medusa_auth_token') || '';
      
      if (!currentToken) {
        throw new Error('Authentication required. Please log in and try again.');
      }
      
      // Call backend with proper authentication
      const response = await fetch(`${backendUrl}/vendor/orders/export`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv',
          'authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      // Get CSV content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export orders. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isError) {
    throw error;
  }

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>{t('orders.domain')}</Heading>
        <Button
          variant="secondary"
          size="small"
          onClick={handleExportCSV}
          disabled={isExporting || isLoading}
        >
          <ArrowDownTray />
          {isExporting ? 'Eksportowanie...' : 'Eksportuj CSV'}
        </Button>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/orders/${row.original.id}`}
        filters={filters}
        count={count}
        search
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          {
            key: 'display_id',
            label: t('orders.fields.displayId'),
          },
          {
            key: 'created_at',
            label: t('fields.createdAt'),
          },
          {
            key: 'updated_at',
            label: t('fields.updatedAt'),
          },
        ]}
        queryObject={raw}
        noRecords={{
          message: t('orders.list.noRecordsMessage'),
        }}
      />
    </Container>
  );
};