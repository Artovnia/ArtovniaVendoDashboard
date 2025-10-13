/**
 * DEPRECATED: This component is deprecated and should not be used.
 * 
 * We have migrated to a new frontend architecture with dedicated return request management.
 * Return requests are now handled through:
 * - /returns - New return requests list (vendor-panel/src/routes/returns/components/returns-list.tsx)
 * - /returns/:id - Return request detail page
 * 
 * The old requests system is being phased out in favor of the new modular approach.
 * 
 * @deprecated Use the new return requests system at /returns instead
 */

import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
} from '@medusajs/ui';
import { SingleColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { useRequests } from '../../../hooks/api';
import { TriangleRightMini } from '@medusajs/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * @deprecated This component is deprecated. Use /returns route instead.
 */
export const Requests = () => {
  const { t } = useTranslation('translation', { useSuspense: false });
  const { getWidgets } = useDashboardExtension();

  const { requests, isError, error } = useRequests();

  const categoryRequests =
    requests?.filter(
      ({ type }: { type: string }) =>
        type === 'product_category'
    ) || [];
  const collectionRequests =
    requests?.filter(
      ({ type }: { type: string }) =>
        type === 'product_collection'
    ) || [];
  const reviewRequests =
    requests?.filter(
      ({ type }: { type: string }) =>
        type === 'review_remove'
    ) || [];
  const ordersRequests =
    requests?.filter(
      ({ type }: { type: string }) => type === 'orders'
    ) || [];
  // Returns are handled separately through a dedicated API endpoint
  // We don't need to filter them from the general requests list

  const categoryRequestCount = categoryRequests.length;
  const collectionRequestCount = collectionRequests.length;
  const reviewRequestCount = reviewRequests.length;
  const ordersRequestsCount = ordersRequests.length;

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets('customer.list.after'),
        before: getWidgets('customer.list.before'),
      }}
    >
      <Container className='p-0'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div>
            <Heading>{t('requests.main.title', 'Requests')}</Heading>
            <Text
              className='text-ui-fg-subtle'
              size='small'
            >
              {t('requests.main.description', 'Check the status of your requests and add new ones')}
            </Text>
          </div>
        </div>
        <div className='px-6 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
          <Link to='/requests/collections'>
            <Button
              variant='secondary'
              className='w-full justify-between py-4'
            >
              <div className='flex gap-4 items-center'>
                <Badge>{collectionRequestCount}</Badge>
                {t('requests.main.collectionsButton', 'Collections requests')}
              </div>
              <TriangleRightMini color='grey' />
            </Button>
          </Link>
          <Link to='/requests/categories'>
            <Button
              variant='secondary'
              className='w-full justify-between py-4'
            >
              <div className='flex gap-4 items-center'>
                <Badge>{categoryRequestCount}</Badge>
                {t('requests.main.categoriesButton', 'Categories requests')}
              </div>
              <TriangleRightMini color='grey' />
            </Button>
          </Link>
          <Link to='/requests/reviews'>
            <Button
              variant='secondary'
              className='w-full justify-between py-4'
            >
              <div className='flex gap-4 items-center'>
                <Badge>{reviewRequestCount}</Badge>
                {t('requests.main.reviewsButton', 'Reviews requests')}
              </div>
              <TriangleRightMini color='grey' />
            </Button>
          </Link>
          <Link to='/requests/orders'>
            <Button
              variant='secondary'
              className='w-full justify-between py-4'
            >
              <div className='flex gap-4 items-center'>
                <Badge>{ordersRequestsCount}</Badge>
                {t('requests.main.ordersButton', 'Orders requests')}
              </div>
              <TriangleRightMini color='grey' />
            </Button>
          </Link>
          {/* DEPRECATED: Old returns requests link - use /returns route instead */}
          {/* 
          <Link to='/requests/returns'>
            <Button
              variant='secondary'
              className='w-full justify-between py-4'
            >
              <div className='flex gap-4 items-center'>
                <Badge color='orange'>{t('requests.main.newBadge', 'New')}</Badge>
                {t('requests.main.returnsButton', 'Returns requests')}
              </div>
              <TriangleRightMini color='grey' />
            </Button>
          </Link>
          */}
        </div>
      </Container>
    </SingleColumnPage>
  );
};
