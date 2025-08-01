import {
  InventoryTypes,
  ProductVariantDTO,
} from '@medusajs/types';

import { Checkbox } from '@medusajs/ui';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceholderCell } from '../../../../components/table/table-cells/common/placeholder-cell';
import { InventoryActions } from './inventory-actions';

/**
 * Adds missing properties to the InventoryItemDTO type.
 */
interface ExtendedInventoryItem
  extends InventoryTypes.InventoryItemDTO {
  variants?: ProductVariantDTO[] | null;
  stocked_quantity?: number;
  reserved_quantity?: number;
  location_levels?: any[]; // Add location_levels property to fix TypeScript errors
}

const columnHelper =
  createColumnHelper<ExtendedInventoryItem>();

export const useInventoryTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          );
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) =>
                row.toggleSelected(!!value)
              }
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          );
        },
      }),
      columnHelper.accessor('title', {
        header: t('fields.title'),
        cell: ({ getValue }) => {
          const title = getValue();

          if (!title) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>{title}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('sku', {
        header: t('fields.sku'),
        cell: ({ getValue }) => {
          const sku = getValue() as string;

          if (!sku) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>{sku}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.location_levels, {
        id: 'reserved_quantity',
        header: t('inventory.reserved'),
        cell: ({ getValue }) => {
          const locations = getValue() as any[];

          const totalReserved = locations ? locations.reduce(
            (sum: number, level: any) =>
              sum + level.reserved_quantity,
            0
          ) : 0;

          if (Number.isNaN(totalReserved)) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>
                {totalReserved}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.location_levels, {
        id: 'available_quantity',
        header: t('fields.inStock'),
        cell: ({ getValue }) => {
          const locations = getValue() as any[];
          const totalAvailable = locations ? locations.reduce(
            (sum: number, level: any) =>
              sum + level.available_quantity,
            0
          ) : 0;

          if (Number.isNaN(totalAvailable)) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>
                {totalAvailable}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => (
          <InventoryActions item={row.original} />
        ),
      }),
    ],
    [t]
  );
};