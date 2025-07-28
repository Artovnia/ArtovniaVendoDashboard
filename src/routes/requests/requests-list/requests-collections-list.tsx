import { Container, Heading, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { SingleColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { RequestListTable } from './components/request-list-table';

export const RequestsCollectionsList = () => {
  const { getWidgets } = useDashboardExtension();
  const { t } = useTranslation();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets('customer.list.after'),
        before: getWidgets('customer.list.before'),
      }}
    >
      <Container className='divided-y p-0'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div>
            <Heading>{t('requests.collections.title')}</Heading>
            <Text
              className='text-ui-fg-subtle'
              size='small'
            >
              {t('requests.collections.description')}
            </Text>
          </div>
        </div>
        <div className='px-6 py-4'>
          <RequestListTable request_type='product_collection' />
        </div>
      </Container>
    </SingleColumnPage>
  );
};
