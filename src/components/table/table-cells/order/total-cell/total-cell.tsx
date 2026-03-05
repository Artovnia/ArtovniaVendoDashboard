import { useTranslation } from 'react-i18next';
import { HttpTypes } from '@medusajs/types';
import { MoneyAmountCell } from '../../common/money-amount-cell';
import { PlaceholderCell } from '../../common/placeholder-cell';
import { calculateActualPaymentStatus } from '../../../../../lib/order-helpers';

type TotalCellProps = {
  currencyCode: string;
  total: number | null;
  order?: HttpTypes.AdminOrder;
};

export const TotalCell = ({
  currencyCode,
  total,
  order,
}: TotalCellProps) => {
  // Check if either total or currencyCode is missing
  if (total === null || typeof total === 'undefined' || !currencyCode) {
    return (
      <div className='flex h-full w-full items-center justify-end'>
        <PlaceholderCell />
      </div>
    );
  }

  const paymentStatus = order ? calculateActualPaymentStatus(order) : undefined;
  const isStruckThrough =
    order?.status === 'canceled' || paymentStatus === 'refunded';

  return (
    <MoneyAmountCell
      currencyCode={currencyCode}
      amount={total}
      align='right'
      isStruckThrough={isStruckThrough}
    />
  );
};

export const TotalHeader = () => {
  const { t } = useTranslation();

  return (
    <div className='flex h-full w-full items-center justify-end'>
      <span className='truncate'>{t('fields.total')}</span>
    </div>
  );
};