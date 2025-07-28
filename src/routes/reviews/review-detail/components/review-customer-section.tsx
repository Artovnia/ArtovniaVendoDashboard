import { Container, Heading } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

export const ReviewCustomerSection = ({
  customer,
}: {
  customer?: any;
}) => {
  const { t } = useTranslation('translation', { useSuspense: false });
  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>{t('reviews.detail.customerSection')}</Heading>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <p>{t('reviews.detail.customerName')}</p>
        <p>
          {customer
            ? `${customer.first_name} ${customer.last_name}`
            : '-'}
        </p>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <p>{t('reviews.detail.customerEmail')}</p>
        <p> {customer ? `${customer.email}` : '-'}</p>
      </div>
    </Container>
  );
};
