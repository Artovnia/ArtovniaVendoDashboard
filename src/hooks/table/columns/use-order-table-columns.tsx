import { HttpTypes } from '@medusajs/types';
import {
  ColumnDef,
  ColumnDefBase,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
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
import {
  SalesChannelCell,
  SalesChannelHeader,
} from '../../../components/table/table-cells/order/sales-channel-cell';
import {
  TotalCell,
  TotalHeader,
} from '../../../components/table/table-cells/order/total-cell';
import { toast } from '@medusajs/ui';
import { backendUrl } from '../../../lib/client/client';

// We have to use any here, as the type of Order is so complex that it lags the TS server
const columnHelper =
  createColumnHelper<HttpTypes.AdminOrder>();

type UseOrderTableColumnsProps = {
  exclude?: string[];
};

export const useOrderTableColumns = (
  props: UseOrderTableColumnsProps
) => {
  const { exclude = [] } = props ?? {};

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
        id: 'sales_channel',
        header: () => <SalesChannelHeader />,
        cell: ({ row }) => {
          const salesChannel = row.original.sales_channel;
          return <SalesChannelCell channel={salesChannel} />;
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
            />
          );
        },
      }),
      columnHelper.display({
        id: 'baselinker_sync',
        header: () => <div className="text-ui-fg-subtle">BaseLinker</div>,
        cell: ({ row }) => {
          const [isSyncing, setIsSyncing] = useState(false);
          const orderId = row.original.id;

          const handleSync = async (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsSyncing(true);

            try {
              const currentToken = window.localStorage.getItem('medusa_auth_token') || '';
              
              const response = await fetch(`${backendUrl}/vendor/orders/${orderId}/sync-to-baselinker`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'authorization': `Bearer ${currentToken}`,
                },
              });

              const result = await response.json();

              if (result.success) {
                if (result.already_synced) {
                  toast.info('Already Synced', {
                    description: `Order already synced to BaseLinker (BL #${result.bl_order_id})`,
                  });
                } else {
                  toast.success('Order Synced', {
                    description: `Successfully synced to BaseLinker (BL #${result.bl_order_id})`,
                  });
                }
              } else if (result.skipped) {
                toast.warning('Sync Skipped', {
                  description: 'BaseLinker not enabled for this seller',
                });
              } else {
                toast.error('Sync Failed', {
                  description: result.error || 'Failed to sync order',
                });
              }
            } catch (error) {
              console.error('Sync error:', error);
              toast.error('Sync Error', {
                description: 'An error occurred while syncing',
              });
            } finally {
              setIsSyncing(false);
            }
          };

          
        },
      }),
    ],
    []
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
