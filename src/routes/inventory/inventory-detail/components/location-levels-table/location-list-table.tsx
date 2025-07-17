import { _DataTable } from '../../../../../components/table/data-table';
import { inventoryItemLevelsQueryKeys, useInventoryItemLevels } from '../../../../../hooks/api/inventory';
import { useDataTable } from '../../../../../hooks/use-data-table';
import { useLocationListTableColumns } from './use-location-list-table-columns';
import { useLocationLevelTableQuery } from './use-location-list-table-query';
import { useEffect } from 'react';
import { queryClient } from '../../../../../lib/query-client';

const PAGE_SIZE = 20;

export const ItemLocationListTable = ({
  inventory_item_id,
}: {
  inventory_item_id: string;
}) => {
  const { searchParams, raw } = useLocationLevelTableQuery({
    pageSize: PAGE_SIZE,
  });

  // Only fetch data once on mount, no aggressive polling
  useEffect(() => {
    // One-time fetch when component mounts
    queryClient.invalidateQueries({ 
      queryKey: inventoryItemLevelsQueryKeys.detail(inventory_item_id),
    });
    
    // No interval polling - this prevents constant refetching that can cause UI issues
    
    // This component doesn't need to clean up any intervals
  }, [inventory_item_id]);

  const { location_levels, count, isLoading } =
    useInventoryItemLevels(inventory_item_id, {
      ...searchParams,
      fields: '*stock_locations',
    }, {
      // Conservative settings to prevent UI issues
      refetchOnMount: true,
      refetchOnWindowFocus: false, // Don't refetch on window focus
      // No automatic refetch interval
      staleTime: 30000, // Consider data fresh for 30 seconds
    });

  const columns = useLocationListTableColumns();

  const { table } = useDataTable({
    data: location_levels ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={location_levels?.length}
      isLoading={isLoading}
      pagination
      queryObject={raw}
    />
  );
};
