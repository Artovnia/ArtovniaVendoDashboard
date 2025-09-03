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
      {ready && <EditStoreCompanyForm seller={seller} />}
    </RouteDrawer>
  );
};
