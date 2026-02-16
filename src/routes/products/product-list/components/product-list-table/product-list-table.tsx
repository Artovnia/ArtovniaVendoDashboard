import { PencilSquare, Trash, Facebook } from '@medusajs/icons';
import {
  Button,
  Container,
  Heading,
  toast,
  usePrompt,
} from '@medusajs/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  Outlet,
} from 'react-router-dom';

import { HttpTypes } from '@medusajs/types';
import { ActionMenu } from '../../../../../components/common/action-menu';
import { _DataTable } from '../../../../../components/table/data-table';
import {
  useDeleteProduct,
  useProducts,
  productsQueryKeys,
} from '../../../../../hooks/api/products';
import { useProductTableColumns } from '../../../../../hooks/table/columns/use-product-table-columns';
import { useProductTableFilters } from '../../../../../hooks/table/filters/use-product-table-filters';
import { useProductTableQuery } from '../../../../../hooks/table/query/use-product-table-query';
import { useDataTable } from '../../../../../hooks/use-data-table';
import { useMe } from '../../../../../hooks/api/users';
import { BulkShippingProfileSelectorModal } from '../bulk-shipping-profile-modal';
import { BulkDeliveryTimeframeModal } from '../bulk-delivery-timeframe-modal';
import { FacebookPromoteModal } from '../../../common/facebook-promote-modal';

const PAGE_SIZE = 20;

export const ProductListTable = () => {
  const { t } = useTranslation();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkDeliveryModal, setShowBulkDeliveryModal] = useState(false);

  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
  });
  
  const { products, count, isLoading, isError, error } =
    useProducts({
      ...searchParams,
      fields: '+thumbnail,+shipping_profile',
    });

  // Memoize products array to prevent new reference on every render
  const memoizedProducts = useMemo(() => 
    (products ?? []) as HttpTypes.AdminProduct[],
    [products]
  );

  const { filters } = useProductTableFilters();
  const columns = useColumns();

  // Create stable getRowId callback
  const getRowId = useCallback((row: HttpTypes.AdminProduct) => row.id, []);

  const { table } = useDataTable({
    data: memoizedProducts,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className='divide-y p-0'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4'>
        <Heading level='h2' className='text-lg sm:text-xl'>{t('products.domain')}</Heading>
        <div className='flex flex-wrap items-center justify-start sm:justify-center gap-2'>
          {/* <Button size='small' variant='secondary' asChild>
            <Link to={`export${location.search}`}>
              {t('actions.export')}
            </Link>
          </Button>
          <Button size='small' variant='secondary' asChild>
            <Link to='import'>{t('actions.import')}</Link>
          </Button> */}
          <Button 
            size='small' 
            variant='secondary'
            onClick={() => setShowBulkModal(true)}
            className='text-xs sm:text-sm whitespace-nowrap'
          >
            {t('products.bulk.assignShippingProfile')}
          </Button>
          <Button 
            size='small' 
            variant='secondary'
            onClick={() => setShowBulkDeliveryModal(true)}
            className='text-xs sm:text-sm whitespace-nowrap'
          >
            {t('deliveryTimeframe.bulkTitle')}
          </Button>
          <Button size='small' variant='secondary' asChild className='text-xs sm:text-sm'>
            <Link to='create'>{t('actions.create')}</Link>
          </Button>
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        navigateTo={(row) => `${row.original.id}`}
        orderBy={[
          { key: 'title', label: t('fields.title') },
          {
            key: 'created_at',
            label: t('fields.createdAt'),
          },
          {
            key: 'updated_at',
            label: t('fields.updatedAt'),
          },
        ]}
        noRecords={{
          message: t('products.list.noRecordsMessage'),
        }}
      />
      {showBulkModal && (
        <BulkShippingProfileSelectorModal
          products={(products ?? []) as HttpTypes.AdminProduct[]}
          onClose={() => setShowBulkModal(false)}
        />
      )}
      {showBulkDeliveryModal && (
        <BulkDeliveryTimeframeModal
          products={(products ?? []) as HttpTypes.AdminProduct[]}
          onClose={() => setShowBulkDeliveryModal(false)}
        />
      )}
      <Outlet />
    </Container>
  );
};

const ProductActions = ({
  product,
}: {
  product: HttpTypes.AdminProduct;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { seller } = useMe();
  const [showFbPromote, setShowFbPromote] = useState(false);
  
  // Get the queryClient to manually invalidate and refetch after deletion
  const queryClient = useQueryClient();
  
  // Pass the product.id to useDeleteProduct
  const { mutateAsync } = useDeleteProduct(product.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t('deleteWarning', {
        title: product.title,
      }),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    try {
      // Call mutateAsync and handle success
      await mutateAsync();
      
      // Show success toast
      toast.success(
        t('toasts.delete.success.header'),
        {
          description: t(
            'toasts.delete.success.description',
            {
              title: product.title,
            }
          ),
        }
      );
      
      // Explicitly refetch the products list after successful deletion
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      queryClient.refetchQueries({
        queryKey: productsQueryKeys.lists(),
      });
    } catch (error: any) {
      // Show error toast with the actual error message
      toast.error(
        t('toasts.delete.error.header'),
        { 
          description: error?.message || error?.body?.message || t('toasts.delete.error.description')
        }
      );
      console.error('Error deleting product:', error);
    }
  };

  return (
    <>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: t('actions.edit'),
                to: `/products/${product.id}/edit`,
              },
              {
                icon: <Facebook />,
                label: t('fbPromote.menuAction', 'Promuj na Facebooku'),
                onClick: () => setShowFbPromote(true),
              },
            ],
          },
          {
            actions: [
              {
                icon: <Trash />,
                label: t('actions.delete'),
                onClick: handleDelete,
              },
            ],
          },
        ]}
      />
      {showFbPromote && (
        <FacebookPromoteModal
          open={showFbPromote}
          onClose={() => setShowFbPromote(false)}
          productId={product.id}
          vendorName={seller?.name}
          vendorId={seller?.id}
        />
      )}
    </>
  );
};

const columnHelper =
  createColumnHelper<HttpTypes.AdminProduct>();

// Define actions cell renderer outside to prevent recreation
const renderActionsCell = ({ row }: any) => (
  <ProductActions product={row.original} />
);

const useColumns = () => {
  const base = useProductTableColumns();

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: 'actions',
        cell: renderActionsCell,
      }),
    ],
    [base]
  );

  return columns;
};
