import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

type UseDataTableProps<TData> = {
  data?: TData[]
  columns: ColumnDef<TData, any>[]
  count?: number
  pageSize?: number
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  rowSelection?: {
    state: RowSelectionState
    updater: OnChangeFn<RowSelectionState>
  }
  enablePagination?: boolean
  enableExpandableRows?: boolean
  getRowId?: (original: TData, index: number) => string
  getSubRows?: (original: TData) => TData[]
  meta?: Record<string, unknown>
  prefix?: string
}

export const useDataTable = <TData,>({
  data = [],
  columns,
  count = 0,
  pageSize: _pageSize = 20,
  enablePagination = true,
  enableRowSelection = false,
  enableExpandableRows = false,
  rowSelection: _rowSelection,
  getSubRows,
  getRowId,
  meta,
  prefix,
}: UseDataTableProps<TData>) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const offsetKey = `${prefix ? `${prefix}_` : ""}offset`
  const offset = searchParams.get(offsetKey)

  // Derive pageIndex directly from URL — single source of truth, no useEffect sync needed
  const pageIndex = offset ? Math.ceil(Number(offset) / _pageSize) : 0
  const pageSize = _pageSize

  const pagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  )

  const [localRowSelection, setLocalRowSelection] = useState({})
  const rowSelection = _rowSelection?.state ?? localRowSelection
  const setRowSelection = _rowSelection?.updater ?? setLocalRowSelection

  // Handle pagination change from react-table (button clicks)
  // Only updates the URL; pageIndex is derived from URL on next render
  const onPaginationChange = useCallback((
    updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)
  ) => {
    setSearchParams((prev) => {
      const currentOffset = prev.get(offsetKey)
      const currentPageIndex = currentOffset ? Math.ceil(Number(currentOffset) / _pageSize) : 0
      const current: PaginationState = { pageIndex: currentPageIndex, pageSize: _pageSize }

      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(current)
          : updaterOrValue

      const newSearch = new URLSearchParams(prev)

      if (!next.pageIndex) {
        newSearch.delete(offsetKey)
      } else {
        newSearch.set(offsetKey, String(next.pageIndex * next.pageSize))
      }

      return newSearch
    })
  }, [offsetKey, _pageSize, setSearchParams])

  const tableOptions = useMemo(() => ({
    data,
    columns,
    state: {
      rowSelection: rowSelection,
      pagination: enablePagination ? pagination : undefined,
    },
    pageCount: Math.ceil((count ?? 0) / pageSize),
    enableRowSelection,
    getRowId,
    getSubRows,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onPaginationChange: enablePagination
      ? (onPaginationChange as OnChangeFn<PaginationState>)
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getExpandedRowModel: enableExpandableRows
      ? getExpandedRowModel()
      : undefined,
    manualPagination: enablePagination ? true : undefined,
    meta,
  }), [
    data,
    columns,
    rowSelection,
    enablePagination,
    pagination,
    count,
    pageSize,
    enableRowSelection,
    getRowId,
    getSubRows,
    setRowSelection,
    onPaginationChange,
    enableExpandableRows,
    meta,
  ])

  const table = useReactTable(tableOptions)

  return { table }
}
