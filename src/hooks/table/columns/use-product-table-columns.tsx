import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';

import {
  CollectionCell,
  CollectionHeader,
} from '../../../components/table/table-cells/product/collection-cell/collection-cell';
import {
  ProductCell,
  ProductHeader,
} from '../../../components/table/table-cells/product/product-cell';
import {
  ProductStatusCell,
  ProductStatusHeader,
} from '../../../components/table/table-cells/product/product-status-cell';
import {
  VariantCell,
  VariantHeader,
} from '../../../components/table/table-cells/product/variant-cell';
import { HttpTypes } from '@medusajs/types';

const columnHelper =
  createColumnHelper<HttpTypes.AdminProduct>();

// Define cell renderers outside component to prevent recreation
const renderProductCell = ({ row }: any) => (
  <ProductCell product={row.original} />
);

const renderCollectionCell = ({ row }: any) => (
  <CollectionCell collection={row.original.collection} />
);

const renderVariantCell = ({ row }: any) => (
  <VariantCell variants={row.original.variants} />
);

const renderStatusCell = ({ row }: any) => (
  <ProductStatusCell status={row.original.status} />
);

export const useProductTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: 'product',
        header: ProductHeader,
        cell: renderProductCell,
      }),
      columnHelper.accessor('collection', {
        header: CollectionHeader,
        cell: renderCollectionCell,
      }),
      columnHelper.accessor('variants', {
        header: VariantHeader,
        cell: renderVariantCell,
      }),
      columnHelper.accessor('status', {
        header: ProductStatusHeader,
        cell: renderStatusCell,
      }),
    ],
    []
  );
};
