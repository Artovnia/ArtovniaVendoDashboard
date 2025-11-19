import { createColumnHelper } from '@tanstack/react-table';
import { Badge, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

export interface OrderForPayout {
  id: string;
  display_id: string;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
  payment_status?: string;
  payout_calculation?: {
    payout_amount: number;
    items_total: number;
    commission_total: number;
    captured_amount: number;
    refunded_amount: number;
    is_refunded: boolean;
    is_partially_refunded: boolean;
  };
}

const columnHelper = createColumnHelper<OrderForPayout>();

export const useOrderTableColumns = () => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number, currencyCode: string = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return [
    columnHelper.accessor('display_id', {
      header: t('fields.order') || 'Order ID',
      enableSorting: false,
      cell: ({ getValue }) => (
        <Text className="font-mono text-sm">#{getValue()}</Text>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: t('fields.date') || 'Date',
      enableSorting: true,
      cell: ({ getValue }) => (
        <Text className="text-sm">{formatDate(getValue())}</Text>
      ),
    }),
    columnHelper.accessor('total', {
      header: t('payout.earnings.fields.payoutAmount') || 'Payout Amount',
      enableSorting: true,
      cell: ({ row }) => {
        const payoutAmount = row.original.payout_calculation?.payout_amount ?? row.original.total;
        const isRefunded = row.original.payout_calculation?.is_refunded ?? false;
        const isPartiallyRefunded = row.original.payout_calculation?.is_partially_refunded ?? false;
        
        return (
          <div className="flex flex-col gap-0.5">
            <Text className="text-sm font-medium">
              {formatCurrency(payoutAmount, row.original.currency_code)}
            </Text>
            {isPartiallyRefunded && (
              <Text className="text-xs text-ui-fg-subtle">
                ({t('payout.earnings.fields.partiallyRefunded')})
              </Text>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: t('fields.status') || 'Status',
      enableSorting: false,
      cell: ({ getValue }) => {
        const status = getValue();
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'completed':
              return 'green';
            case 'pending':
              return 'orange';
            case 'canceled':
              return 'red';
            default:
              return 'grey';
          }
        };

        return (
          <Badge color={getStatusColor(status)}>
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'payout_status',
      header: t('payout.earnings.fields.payoutStatus') || 'Payout Status',
      enableSorting: false,
      cell: () => (
        <Badge color="orange">
          {t('payout.status.awaitingPayout') || 'Awaiting Payout'}
        </Badge>
      ),
    }),
  ];
};
