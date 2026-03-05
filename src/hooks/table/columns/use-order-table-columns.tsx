import { HttpTypes } from '@medusajs/types';
import { CheckCircle } from '@medusajs/icons';
import {
  ColumnDef,
  ColumnDefBase,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@medusajs/ui';
import { ActionMenu } from '../../../components/common/action-menu';
import {
  DateCell,
  DateHeader,
} from '../../../components/table/table-cells/common/date-cell';
// import { CountryCell } from '../../../components/table/table-cells/order/country-cell';
import {
  CustomerCell,
  CustomerHeader,
} from '../../../components/table/table-cells/order/customer-cell';
import {
  DisplayIdCell,
  DisplayIdHeader,
} from '../../../components/table/table-cells/order/display-id-cell';
import {
  FulfillmentStatusCell,
  FulfillmentStatusHeader,
} from '../../../components/table/table-cells/order/fulfillment-status-cell';
import {
  PaymentStatusCell,
  PaymentStatusHeader,
} from '../../../components/table/table-cells/order/payment-status-cell';
import { StatusCell } from '../../../components/table/table-cells/common/status-cell';
import {
  TotalCell,
  TotalHeader,
} from '../../../components/table/table-cells/order/total-cell';
import { useCompleteOrder } from '../../api/orders';

// We have to use any here, as the type of Order is so complex that it lags the TS server
const columnHelper =
  createColumnHelper<HttpTypes.AdminOrder>();

type UseOrderTableColumnsProps = {
  exclude?: string[];
  onOrderCompleted?: () => void;
};

const OrderCompleteActionCell = ({
  order,
  onCompleted,
}: {
  order: HttpTypes.AdminOrder;
  onCompleted?: () => void;
}) => {
  const { t } = useTranslation();
  const { mutate, isPending } = useCompleteOrder(order.id, {
    onSuccess: () => {
      toast.success(t('orders.listActions.completeSuccess'));
      onCompleted?.();
    },
    onError: () => {
      toast.error(t('orders.listActions.completeError'));
    },
  });

  const canCompleteOrder = order.fulfillment_status === 'delivered';

  const isActionDisabled =
    !canCompleteOrder ||
    isPending ||
    order.status === 'completed' ||
    order.status === 'canceled';

  const handleComplete = () => {
    if (isActionDisabled) {
      return;
    }

    mutate();
  };

  if (!canCompleteOrder) {
    return null;
  }

  return (
    <div className='flex h-full w-full  items-center justify-end'>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <CheckCircle />,
                label: isPending
                  ? `${t('actions.complete')}...`
                  : t('actions.complete'),
                onClick: handleComplete,
                disabled: isActionDisabled,
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export const useOrderTableColumns = (
  props: UseOrderTableColumnsProps
) => {
  const { t } = useTranslation();
  const { exclude = [], onOrderCompleted } = props ?? {};

  const columns = useMemo(
    () => [
      columnHelper.accessor('display_id', {
        header: () => <DisplayIdHeader />,
        cell: ({ getValue }) => {
          const id = getValue();

          return <DisplayIdCell displayId={id!} />;
        },
      }),
      columnHelper.accessor('created_at', {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const date = new Date(getValue());

          return <DateCell date={date} />;
        },
      }),
      columnHelper.display({
        id: 'customer',
        header: () => <CustomerHeader />,
        cell: ({ row }) => {
          const customer = row.original.customer;
          return <CustomerCell customer={customer} />;
        },
      }),
      columnHelper.display({
        id: 'order_lifecycle_status',
        header: () => (
          <div className='flex h-full w-full items-center'>
            <span className='truncate'>{t('orders.listStatus.label')}</span>
          </div>
        ),
        cell: ({ row }) => {
          const orderStatus = row.original.status;

          if (orderStatus === 'canceled') {
            return <StatusCell color='red'>{t('orders.listStatus.canceled')}</StatusCell>;
          }

          if (orderStatus === 'completed') {
            return <StatusCell color='green'>{t('orders.listStatus.fulfilled')}</StatusCell>;
          }

          return <StatusCell color='orange'>{t('orders.listStatus.pending')}</StatusCell>;
        },
      }),
      columnHelper.accessor('payment_status', {
        header: () => <PaymentStatusHeader />,
        cell: ({ getValue, row }) => {
          const status = getValue();
          const order = row.original;

          return <PaymentStatusCell status={status} order={order} />;
        },
      }),
      columnHelper.accessor('fulfillment_status', {
        header: () => <FulfillmentStatusHeader />,
        cell: ({ getValue }) => {
          const status = getValue();

          return <FulfillmentStatusCell status={status} />;
        },
      }),
      columnHelper.accessor('total', {
        header: () => <TotalHeader />,
        cell: ({ getValue, row }) => {
          // Check the entire row object to see what data we have
          
          
          const total = getValue();
          const currencyCode = row.original.currency_code;
          
         
          return (
            <TotalCell
              currencyCode={currencyCode || 'PLN'} // Use PLN as a fallback currency
              total={typeof total === 'number' ? total : 0} // Ensure we have a valid number
              order={row.original}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <div className='flex h-full w-full items-center justify-end'>
            <span className='truncate'>{t('dashboard.actions')}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <OrderCompleteActionCell
              order={row.original}
              onCompleted={onOrderCompleted}
            />
          );
        },
      }),
    ],
    [t, onOrderCompleted]
  );

  const isAccessorColumnDef = (
    c: any
  ): c is ColumnDef<HttpTypes.AdminOrder> & {
    accessorKey: string;
  } => {
    return c.accessorKey !== undefined;
  };

  const isDisplayColumnDef = (
    c: any
  ): c is ColumnDef<HttpTypes.AdminOrder> & {
    id: string;
  } => {
    return c.id !== undefined;
  };

  const shouldExclude = <
    TDef extends ColumnDefBase<HttpTypes.AdminOrder, any>,
  >(
    c: TDef
  ) => {
    if (isAccessorColumnDef(c)) {
      return exclude.includes(c.accessorKey);
    } else if (isDisplayColumnDef(c)) {
      return exclude.includes(c.id);
    }

    return false;
  };

  return columns.filter(
    (c) => !shouldExclude(c)
  ) as ColumnDef<HttpTypes.AdminOrder>[];
};
