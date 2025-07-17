import { Heading } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { RouteDrawer } from '../../../components/modals';
import { usePriceList } from '../../../hooks/api/price-lists';
import { PriceListEditForm } from './components/price-list-edit-form';

export const PriceListEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { price_list, isLoading, isError, error } =
    usePriceList(id!);

  // Add safeguards to ensure price_list is properly formatted
  let priceListData = null;
  if (price_list) {
    if (Array.isArray(price_list)) {
      priceListData = price_list[0];
    } else if (typeof price_list === 'object') {
      priceListData = price_list;
    }
  }

  const ready = !isLoading && priceListData;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t('priceLists.edit.header')}</Heading>
      </RouteDrawer.Header>
      {ready && (
        <PriceListEditForm priceList={priceListData} />
      )}
    </RouteDrawer>
  );
};
