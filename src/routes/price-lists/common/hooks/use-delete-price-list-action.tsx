// Using 'any' type for price list to handle different structures
import { toast, usePrompt } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useDeletePriceList } from '../../../../hooks/api/price-lists';

export const useDeletePriceListAction = ({
  priceList,
}: {
  priceList: any; // Use any type to handle different price list structures
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  // Handle different price list object structures
  // Some components pass {id, title, ...} while others pass {price_list_id, price_list: {id, title, ...}}
  let priceListId = '';
  let priceListTitle = '';
  
  if (priceList) {
    if (priceList.price_list_id) {
      // Structure: {price_list_id, price_list: {...}}
      priceListId = priceList.price_list_id;
      priceListTitle = priceList.price_list?.title || 'Price List';
    } else if (priceList.id) {
      // Structure: {id, title, ...}
      priceListId = priceList.id;
      priceListTitle = priceList.title || 'Price List';
    }
  }
  
  if (!priceListId) {
    console.error('Could not determine price list ID from object:', priceList);
  } else {
    console.log(`Using price list ID: ${priceListId} for deletion`);
  }
  
  // Use the extracted price list ID for deletion
  const { mutateAsync } = useDeletePriceList(priceListId);

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t('priceLists.delete.confirmation', {
        title: priceListTitle,
      }),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t('priceLists.delete.successToast', {
            title: priceList.title,
          })
        );

        navigate('/price-lists');
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };

  return handleDelete;
};
