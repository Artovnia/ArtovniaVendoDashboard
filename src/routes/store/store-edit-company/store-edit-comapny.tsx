import { Heading } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { RouteDrawer } from '../../../components/modals';
import { useMe } from '../../../hooks/api';
import { EditStoreCompanyForm } from './components/edit-store-company-form';

export const StoreEditCompany = () => {
  const { t } = useTranslation();
  const {
    seller,
    isPending: isLoading,
    isError,
    error,
  } = useMe();

  if (isError) {
    throw error;
  }

  const ready = !!seller && !isLoading;
  
  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t('store.company.edit.header')}</Heading>
      </RouteDrawer.Header>
      {isLoading && (
        <RouteDrawer.Body className='flex-1 overflow-y-auto'>
          <div className='flex items-center justify-center p-8'>
            <div className='animate-spin'>⏳</div>
          </div>
        </RouteDrawer.Body>
      )}
      {!isLoading && !seller && (
        <RouteDrawer.Body className='flex-1 overflow-y-auto'>
          <div className='flex items-center justify-center p-8'>
            <p className='text-ui-fg-error'>{t('store.company.edit.error', 'Nie można załadować danych sprzedawcy')}</p>
          </div>
        </RouteDrawer.Body>
      )}
      {ready && <EditStoreCompanyForm seller={seller} />}
    </RouteDrawer>
  );
};
