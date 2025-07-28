import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DateCell } from '../../../../components/table/table-cells/common/date-cell';
import { StatusCell } from '../../../../components/table/table-cells/request/status-cell';
import { RequestsActions } from './requests-actions';

const columnHelper = createColumnHelper<any>();

export const useRequestsReviewsTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor('data.review_id', {
        header: t('requests.table.review'),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('data.reason', {
        header: t('requests.table.reason'),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('created_at', {
        header: t('requests.table.date'),
        cell: ({ getValue }) => (
          <DateCell date={getValue()} />
        ),
      }),
      columnHelper.accessor('status', {
        header: t('requests.table.status'),
        cell: ({ getValue }) => (
          <StatusCell status={getValue()} />
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          const request = row.original;

          if (request.status !== 'pending') return null;

          return <RequestsActions request={request} />;
        },
      }),
    ],
    [t]
  );
};
