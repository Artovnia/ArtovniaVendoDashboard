import { XCircle } from '@medusajs/icons';
import {
  AdminOrder,
  AdminOrderFulfillment,
  AdminOrderLineItem,
  HttpTypes,
  OrderLineItemDTO,
} from '@medusajs/types';
import {
  Button,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  Tooltip,
  toast,
  usePrompt,
} from '@medusajs/ui';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ActionMenu } from '../../../../../components/common/action-menu';
import { Skeleton } from '../../../../../components/common/skeleton';
import { Thumbnail } from '../../../../../components/common/thumbnail';
import {
  useCancelOrderFulfillment,
  useMarkOrderFulfillmentAsDelivered,
} from '../../../../../hooks/api/orders';
import { useStockLocation } from '../../../../../hooks/api/stock-locations';
import { formatProvider } from '../../../../../lib/format-provider';
import { getLocaleAmount } from '../../../../../lib/money-amount-helpers';
import { FulfillmentSetType } from '../../../../locations/common/constants';
import { fetchQuery } from '../../../../../lib/client/client';
import { queryClient } from '../../../../../lib/query-client';
import { ordersQueryKeys } from '../../../../../hooks/api/orders';

type OrderFulfillmentSectionProps = {
  order: AdminOrder;
};

// Group fulfillments created within 5 seconds of each other (from same fulfillment action)
const groupFulfillments = (fulfillments: AdminOrderFulfillment[]) => {
  if (fulfillments.length === 0) return [];

  // Sort by creation time
  const sorted = [...fulfillments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const groups: AdminOrderFulfillment[][] = [];
  let currentGroup: AdminOrderFulfillment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    
    const timeDiff = 
      new Date(current.created_at).getTime() - 
      new Date(previous.created_at).getTime();

    // If created within 5 seconds, consider it part of the same group
    if (timeDiff <= 5000) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  // Push the last group
  groups.push(currentGroup);
  
  return groups;
};

export const OrderFulfillmentSection = ({
  order,
}: OrderFulfillmentSectionProps) => {
  const fulfillments = order.fulfillments || [];
  const fulfillmentGroups = groupFulfillments(fulfillments);

  return (
    <div className='flex flex-col gap-y-3'>
      <UnfulfilledItemBreakdown order={order} />
      {fulfillmentGroups.map((group, index) => (
        <FulfillmentGroup
          key={group[0].id}
          index={index}
          fulfillments={group}
          order={order}
        />
      ))}
    </div>
  );
};

const UnfulfilledItem = ({
  item,
  currencyCode,
}: {
  item: OrderLineItemDTO & {
    variant: HttpTypes.AdminProductVariant;
  };
  currencyCode: string;
}) => {
  return (
    <div
      key={item.id}
      className='text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4'
    >
      <div className='flex items-start gap-x-4'>
        <Thumbnail src={item.thumbnail} />
        <div>
          <Link
            to={`/products/${item.product_id}`}
            className='text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg'
          >
            <Text
              size='small'
              leading='compact'
              weight='plus'
              className='text-ui-fg-base hover:text-ui-fg-interactive'
            >
              {item.title}
            </Text>
          </Link>
          {item.variant_sku && (
            <div className='flex items-center gap-x-1'>
              <Text size='small'>{item.variant_sku}</Text>
              <Copy
                content={item.variant_sku}
                className='text-ui-fg-muted'
              />
            </div>
          )}
          {item.variant?.options && item.variant.options.length > 0 && (
            <div className='flex flex-wrap items-center gap-1 mt-1'>
              {item.variant.options.map((opt, idx) => (
                <span key={idx} className='text-xs'>
                  <span className='text-ui-fg-muted'>{opt.option?.title || 'Option'}:</span>{' '}
                  <span className='text-ui-fg-subtle font-medium'>{opt.value}</span>
                  {idx < (item.variant.options?.length || 0) - 1 && <span className='text-ui-fg-muted mx-1'>·</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className='grid grid-cols-3 items-center gap-x-4'>
        <div className='flex items-center justify-end'>
          <Text size='small'>
            {getLocaleAmount(Number(item.unit_price), currencyCode)}
          </Text>
        </div>
        <div className='flex items-center justify-end'>
          <Text>
            <span className='tabular-nums'>
              {item.quantity -
                item.detail.fulfilled_quantity}
            </span>
            x
          </Text>
        </div>
        <div className='flex items-center justify-end'>
          <Text size='small'>
            {getLocaleAmount(
              Number(item.subtotal || 0),
              currencyCode
            )}
          </Text>
        </div>
      </div>
    </div>
  );
};

const UnfulfilledItemBreakdown = ({
  order,
}: {
  order: AdminOrder;
}) => {
  // Create an array of order items that haven't been fulfilled or at least not fully fulfilled
  const unfulfilledItemsWithShipping = order.items!.filter(
    (i) =>
      i.requires_shipping &&
      i.detail.fulfilled_quantity < i.quantity
  );

  const unfulfilledItemsWithoutShipping =
    order.items!.filter(
      (i) =>
        !i.requires_shipping &&
        i.detail.fulfilled_quantity < i.quantity
    );

  return (
    <>
      {!!unfulfilledItemsWithShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithShipping}
          requiresShipping={true}
        />
      )}

      {!!unfulfilledItemsWithoutShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithoutShipping}
          requiresShipping={false}
        />
      )}
    </>
  );
};

const UnfulfilledItemDisplay = ({
  order,
  unfulfilledItems,
  requiresShipping = false,
}: {
  order: AdminOrder;
  unfulfilledItems: AdminOrderLineItem[];
  requiresShipping: boolean;
}) => {
  const { t } = useTranslation();

  if (order.status === 'canceled') {
    return;
  }

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading level='h2'>
          {t('orders.fulfillment.unfulfilledItems')}
        </Heading>

        <div className='flex items-center gap-x-4'>
          {requiresShipping && (
            <StatusBadge
              color='red'
              className='text-nowrap'
            >
              {t('orders.fulfillment.requiresShipping')}
            </StatusBadge>
          )}

          <StatusBadge color='red' className='text-nowrap'>
            {t(
              'orders.fulfillment.awaitingFulfillmentBadge'
            )}
          </StatusBadge>
        </div>
      </div>
      <div>
        {unfulfilledItems.map(
          (item: AdminOrderLineItem) => (
            <UnfulfilledItem
              key={item.id}
              item={item as any}
              currencyCode={order.currency_code}
            />
          )
        )}
      </div>
      <div className='px-6 py-4 flex justify-end'>
        <Link
          to={`/orders/${order.id}/fulfillment?requires_shipping=${requiresShipping}`}
        >
          <Button>{t('orders.fulfillment.fulfillItems')}</Button>
        </Link>
      </div>
    </Container>
  );
};

const FulfillmentGroup = ({
  fulfillments,
  order,
  index,
}: {
  fulfillments: AdminOrderFulfillment[];
  order: AdminOrder;
  index: number;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  // Use the first fulfillment as the "primary" for shared properties
  const primaryFulfillment = fulfillments[0];
  const showLocation = !!primaryFulfillment.location_id;

  const isPickUpFulfillment =
    (primaryFulfillment as any).shipping_option?.service_zone
      ?.fulfillment_set?.type === FulfillmentSetType.Pickup;

  const { stock_location, isError, error } =
    useStockLocation(primaryFulfillment.location_id!, undefined, {
      enabled: showLocation,
    });

  // Determine group status - all fulfillments must have same status for simplicity
  // If any differ, show the most "advanced" status
  let statusText = primaryFulfillment.requires_shipping
    ? isPickUpFulfillment
      ? 'Awaiting pickup'
      : 'Awaiting shipping'
    : 'Awaiting delivery';
  let statusColor: 'blue' | 'green' | 'red' = 'blue';
  let statusTimestamp = primaryFulfillment.created_at;

  const allCanceled = fulfillments.every(f => f.canceled_at);
  const allDelivered = fulfillments.every(f => f.delivered_at);
  const allShipped = fulfillments.every(f => f.shipped_at);
  const anyCanceled = fulfillments.some(f => f.canceled_at);
  const anyShipped = fulfillments.some(f => f.shipped_at);

  if (allCanceled) {
    statusText = 'Canceled';
    statusColor = 'red';
    statusTimestamp = primaryFulfillment.canceled_at!;
  } else if (allDelivered) {
    statusText = 'Delivered';
    statusColor = 'green';
    statusTimestamp = primaryFulfillment.delivered_at!;
  } else if (allShipped) {
    statusText = 'Shipped';
    statusColor = 'green';
    statusTimestamp = primaryFulfillment.shipped_at!;
  }

  const showShippingButton =
    !anyCanceled &&
    !anyShipped &&
    !allDelivered &&
    primaryFulfillment.requires_shipping &&
    !isPickUpFulfillment;

  const showDeliveryButton =
    !anyCanceled && !allDelivered;

  // Handle marking all fulfillments as delivered
  const handleMarkAsDelivered = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t(
        'orders.fulfillment.markAsDeliveredWarning'
      ),
      confirmText: t('actions.continue'),
      cancelText: t('actions.cancel'),
      variant: 'confirmation',
    });

    if (res) {
      // Mark all fulfillments in the group as delivered
      try {
        for (const fulfillment of fulfillments) {
          await fetchQuery(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
            {
              method: 'POST',
            }
          );
        }
        
        // Invalidate order queries to refresh the UI
        await queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.detail(order.id),
        });
        await queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.lists(),
        });
        
        toast.success(
          t(
            isPickUpFulfillment
              ? 'orders.fulfillment.toast.fulfillmentPickedUp'
              : 'orders.fulfillment.toast.fulfillmentDelivered'
          )
        );
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  // Handle canceling all fulfillments
  const handleCancel = async () => {
    if (anyShipped) {
      toast.warning(
        t('orders.fulfillment.toast.fulfillmentShipped')
      );
      return;
    }

    const res = await prompt({
      title: t('general.areYouSure'),
      description: t('orders.fulfillment.cancelWarning'),
      confirmText: t('actions.continue'),
      cancelText: t('actions.cancel'),
    });

    if (res) {
      // Cancel all fulfillments in the group
      try {
        for (const fulfillment of fulfillments) {
          await fetchQuery(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/cancel`,
            {
              method: 'POST',
            }
          );
        }
        
        // Invalidate order queries to refresh the UI
        await queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.detail(order.id),
        });
        await queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.lists(),
        });
        
        toast.success(
          t('orders.fulfillment.toast.canceled')
        );
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  // Create shipments for all fulfillments in the group
  const handleCreateShipment = () => {
    // Navigate to shipment creation with all fulfillment IDs
    // The form will handle creating shipments for all of them
    const fulfillmentIds = fulfillments.map(f => f.id).join(',');
    navigate(`./${primaryFulfillment.id}/create-shipment?group=${fulfillmentIds}`);
  };

  if (isError) {
    throw error;
  }

  // Collect all items from all fulfillments in the group
  const allItems = fulfillments.flatMap(f => (f as any).items || []);

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading level='h2'>
          {t('orders.fulfillment.number', {
            number: index + 1,
          })}
        </Heading>
        <div className='flex items-center gap-x-4'>
          <Tooltip
            content={format(
              new Date(statusTimestamp),
              'dd MMM, yyyy, HH:mm:ss'
            )}
          >
            <StatusBadge
              color={statusColor}
              className='text-nowrap'
            >
              {statusText}
            </StatusBadge>
          </Tooltip>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t('actions.cancel'),
                    icon: <XCircle />,
                    onClick: handleCancel,
                    disabled: anyCanceled,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className='text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4'>
        <Text size='small' leading='compact' weight='plus'>
          {t('orders.fulfillment.itemsLabel')}
        </Text>
        <ul className='space-y-1'>
          {allItems.map((f_item: any) => {
            // Find the original order item to get product_id and variant options
            const orderItem = order.items?.find(i => i.id === f_item.line_item_id);
            const hasOptions = orderItem?.variant?.options && orderItem.variant.options.length > 0;
            
            return (
              <li key={f_item.line_item_id}>
                {orderItem?.product_id ? (
                  <Link
                    to={`/products/${orderItem.product_id}`}
                    className='text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg'
                  >
                    <Text size='small' leading='compact'>
                      {f_item.quantity}x {f_item.title}
                    </Text>
                  </Link>
                ) : (
                  <Text size='small' leading='compact'>
                    {f_item.quantity}x {f_item.title}
                  </Text>
                )}
                {hasOptions && orderItem.variant && (
                  <div className='flex flex-wrap items-center gap-1 ml-6 mt-0.5'>
                    {orderItem.variant.options?.map((opt: any, idx: number) => (
                      <span key={idx} className='text-xs'>
                        <span className='text-ui-fg-muted'>{opt.option?.title || 'Option'}:</span>{' '}
                        <span className='text-ui-fg-subtle font-medium'>{opt.value}</span>
                        {idx < (orderItem.variant.options?.length || 0) - 1 && <span className='text-ui-fg-muted mx-1'>·</span>}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {showLocation && (
        <div className='text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4'>
          <Text
            size='small'
            leading='compact'
            weight='plus'
          >
            {t('orders.fulfillment.shippingFromLabel')}
          </Text>
          {stock_location ? (
            <Link
              to={`/settings/locations/${stock_location.id}`}
              className='text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg'
            >
              <Text size='small' leading='compact'>
                {stock_location.name}
              </Text>
            </Link>
          ) : (
            <Skeleton className='w-16' />
          )}
        </div>
      )}
      <div className='text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4'>
        <Text size='small' leading='compact' weight='plus'>
          {t('fields.provider')}
        </Text>

        <Text size='small' leading='compact'>
          {formatProvider(primaryFulfillment.provider_id)}
        </Text>
      </div>
      <div className='text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4'>
        <Text size='small' leading='compact' weight='plus'>
          {t('orders.fulfillment.trackingLabel')}
        </Text>
        <div>
          {(primaryFulfillment as any).labels &&
          (primaryFulfillment as any).labels.length > 0 ? (
            <ul>
              {(primaryFulfillment as any).labels.map((tlink: any) => {
                const hasUrl =
                  tlink.url &&
                  tlink.url.length > 0 &&
                  tlink.url !== '#';

                if (hasUrl) {
                  return (
                    <li key={tlink.tracking_number}>
                      <a
                        href={tlink.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg'
                      >
                        <Text
                          size='small'
                          leading='compact'
                        >
                          {tlink.tracking_number}
                        </Text>
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={tlink.tracking_number}>
                    <Text size='small' leading='compact'>
                      {tlink.tracking_number}
                    </Text>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Text size='small' leading='compact'>
              -
            </Text>
          )}
        </div>
      </div>

      {(showShippingButton || showDeliveryButton) && (
        <div className='bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4'>
          {showDeliveryButton && (
            <Button
              onClick={handleMarkAsDelivered}
              variant='secondary'
            >
              {t(
                isPickUpFulfillment
                  ? 'orders.fulfillment.markAsPickedUp'
                  : 'orders.fulfillment.markAsDelivered'
              )}
            </Button>
          )}

          {showShippingButton && (
            <Button
              onClick={handleCreateShipment}
              variant='secondary'
            >
              {t('orders.fulfillment.markAsShipped')}
            </Button>
          )}
        </div>
      )}
    </Container>
  );
};
