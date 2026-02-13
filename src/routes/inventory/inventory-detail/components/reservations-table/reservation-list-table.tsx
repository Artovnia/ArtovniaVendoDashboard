import { HttpTypes } from "@medusajs/types"
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useCallback, useRef, useState } from "react"

import { DataTableRoot } from "../../../../../components/table/data-table/data-table-root"
import { TableSkeleton } from "../../../../../components/common/skeleton"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { useReservationItems } from "../../../../../hooks/api/reservations"
import {
  ExtendedReservationItem,
  useReservationTableColumn,
} from "./use-reservation-list-table-columns"

const PAGE_SIZE = 20

export const ReservationItemTable = ({
  inventoryItem,
}: {
  inventoryItem: HttpTypes.AdminInventoryItemResponse["inventory_item"]
}) => {
  const [pageIndex, setPageIndex] = useState(0)
  const pageIndexRef = useRef(pageIndex)
  pageIndexRef.current = pageIndex

  const { reservations, count, isPending, isError, error } =
    useReservationItems({
      inventory_item_id: inventoryItem.id,
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
    })

  // Preserve last known count during loading to prevent pageCount from dropping to 0
  const lastCountRef = useRef(0)
  if (count != null) {
    lastCountRef.current = count
  }
  const stableCount = count ?? lastCountRef.current

  const columns = useReservationTableColumn({ sku: inventoryItem.sku! })

  const pageCount = Math.ceil(stableCount / PAGE_SIZE)

  const onPaginationChange = useCallback((updater: any) => {
    const current = { pageIndex: pageIndexRef.current, pageSize: PAGE_SIZE }
    const next = typeof updater === "function" ? updater(current) : updater
    if (next.pageIndex !== pageIndexRef.current) {
      setPageIndex(next.pageIndex)
    }
  }, [])

  const table = useReactTable({
    data: (reservations as ExtendedReservationItem[] | undefined) ?? [],
    columns,
    state: {
      pagination: {
        pageIndex,
        pageSize: PAGE_SIZE,
      },
    },
    pageCount,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getRowId: (row: ExtendedReservationItem) => row.id,
  })

  if (isError) {
    throw error
  }

  if (isPending) {
    return (
      <TableSkeleton
        layout="fit"
        rowCount={PAGE_SIZE}
        search={false}
        filters={false}
        orderBy={false}
        pagination
      />
    )
  }

  if (stableCount === 0) {
    return <NoRecords />
  }

  // Render DataTableRoot directly (not memoized) so it always re-renders on page change
  return (
    <DataTableRoot
      table={table}
      columns={columns}
      count={stableCount}
      pagination
      noResults={false}
      layout="fit"
    />
  )
}
