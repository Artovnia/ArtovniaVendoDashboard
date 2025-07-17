import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"

import { _DataTable } from "../../../../../components/table/data-table"
import { useStockLocations } from "../../../../../hooks/api"
import { useReservationItems } from "../../../../../hooks/api/reservations"
import { useDataTable } from "../../../../../hooks/use-data-table"
import {
  ExtendedReservationItem,
  useReservationTableColumn,
} from "./use-reservation-list-table-columns"
import { useReservationsTableQuery } from "./use-reservation-list-table-query"

const PAGE_SIZE = 20

export const ReservationItemTable = ({
  inventoryItem,
}: {
  inventoryItem: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}) => {
  const { searchParams, raw } = useReservationsTableQuery({
    pageSize: PAGE_SIZE,
  })

  // The backend API doesn't support filtering by inventory_item_id
  // We'll fetch all reservations and filter them client-side
  const { reservations: allReservations, count, isPending, isError, error } =
    useReservationItems({
      ...searchParams,
    })

  // Get filtered reservations first to use for stock location IDs
  const filteredReservations = useMemo(() => {
    return (allReservations || []).filter((r: any) => 
      r.inventory_item_id === inventoryItem.id
    );
  }, [allReservations, inventoryItem.id]);

  const { stock_locations } = useStockLocations({
    id: filteredReservations.map((r: any) => r.location_id),
  })

  const data = useMemo<ExtendedReservationItem[]>(() => {
    const locationMap = new Map((stock_locations || []).map((l) => [l.id, l]))

    return filteredReservations.map((r: any) => ({
      ...r,
      location: locationMap.get(r.location_id),
    }))
  }, [filteredReservations, stock_locations])

  const columns = useReservationTableColumn({ sku: inventoryItem.sku! })

  const { table } = useDataTable({
    data: data ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row: ExtendedReservationItem) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      isLoading={isPending}
      pagination
      queryObject={raw}
    />
  )
}
