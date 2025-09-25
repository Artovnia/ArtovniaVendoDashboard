import { useMemo, useState } from 'react'
import {
  Button,
  Text,
  Checkbox,
} from "@medusajs/ui"
import { useTranslation } from 'react-i18next'
import { HttpTypes } from '@medusajs/types'
import { keepPreviousData } from '@tanstack/react-query'
import {
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from '@tanstack/react-table'
import { useProductTableColumns } from '../../../hooks/table/columns/use-product-table-columns'
import { Table } from '@medusajs/ui'
import { useProducts } from '../../../hooks/api/products'
import { useProductTableFilters } from '../../../hooks/table/filters/use-product-table-filters'
import { useProductTableQuery } from '../../../hooks/table/query/use-product-table-query'
import { useDataTable } from '../../../hooks/use-data-table'
import { RouteFocusModal } from '../../../components/modals'

interface ProductSelectorProps {
  selectedProducts: string[]
  onSelectionChange: (productIds: string[]) => void
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const PAGE_SIZE = 50
const PREFIX = 'ps'

function getInitialSelection(products: { id: string }[]) {
  return products.reduce((acc, curr) => {
    acc[curr.id] = true
    return acc
  }, {} as RowSelectionState)
}

export const ProductSelector = ({
  selectedProducts,
  onSelectionChange,
  onConfirm,
  onCancel,
  isLoading = false,
}: ProductSelectorProps) => {
  const { t } = useTranslation()
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    getInitialSelection(selectedProducts.map(id => ({ id })))
  )

  const { searchParams } = useProductTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  
  const { products, count, isLoading: isProductsLoading, isError, error } = useProducts({
    ...searchParams,
    fields: 'id,title,thumbnail,handle,variants,status'
  }, {
    placeholderData: keepPreviousData,
  })

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === 'function' ? fn(rowSelection) : fn
    const ids = Object.keys(state)
    onSelectionChange(ids)
    setRowSelection(state)
  }

  const productColumns = useProductTableColumns()
  const filters = useProductTableFilters()
  
  // Create columns with checkbox selection - move thumbnail next to checkbox
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: '',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-x-3">
            <Checkbox
              checked={rowSelection[product.id] || false}
              onCheckedChange={(checked) => {
                const newSelection = { ...rowSelection }
                if (checked) {
                  newSelection[product.id] = true
                } else {
                  delete newSelection[product.id]
                }
                setRowSelection(newSelection)
                onSelectionChange(Object.keys(newSelection))
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
            <div className="flex items-center gap-x-3">
              <div className="w-fit flex-shrink-0">
                <div className="bg-ui-bg-component border-ui-border-base flex items-center justify-center overflow-hidden rounded border h-8 w-8">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="text-ui-fg-subtle h-4 w-4" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-ui-fg-base font-normal text-sm">{product.title}</span>
               
              </div>
            </div>
          </div>
        )
      },
    }),
    // Remove the product column since we moved thumbnail to select column
    ...productColumns.slice(1)
  ], [productColumns, rowSelection, onSelectionChange])

  const { table } = useDataTable({
    data: products || [],
    columns,
    count,
    enablePagination: true,
    enableRowSelection: (row) => {
      return !!row.original.variants?.length
    },
    getRowId: (row) => row.id,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    pageSize: PAGE_SIZE,
  })


  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <RouteFocusModal.Title>{t("platformPromotions.productSelector.title")}</RouteFocusModal.Title>
        <RouteFocusModal.Description>
          {t("platformPromotions.productSelector.subtitle")}
        </RouteFocusModal.Description>
      </RouteFocusModal.Header>
      
      <RouteFocusModal.Body className="flex flex-col size-full overflow-hidden">
        <div className="flex-1 min-h-0">
          <Table>
            <Table.Header>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.HeaderCell key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                    </Table.HeaderCell>
                  ))}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.map((row) => (
                <Table.Row key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                      {cell.column.columnDef.cell 
                        ? typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.column.columnDef.cell
                        : cell.renderValue() as React.ReactNode}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </RouteFocusModal.Body>

      <RouteFocusModal.Footer>
        <div className="flex items-center justify-between w-full">
          <Text className="text-ui-fg-muted">
            {Object.keys(rowSelection).length} {t("platformPromotions.productSelector.selected")}
          </Text>
          <div className="flex items-center gap-x-2">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("platformPromotions.productSelector.cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={selectedProducts.length === 0 || isLoading}
              isLoading={isLoading}
            >
              {t("platformPromotions.productSelector.confirm")}
            </Button>
          </div>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminProduct>()
