import { useQueryParams } from "../../../../../hooks/use-query-params"

export const useReservationsTableQuery = ({
  pageSize = 20,
  prefix,
  inventoryItemId,
}: {
  pageSize?: number
  prefix?: string
  inventoryItemId?: string
}) => {
  const raw = useQueryParams(
    [
      "offset",
      "id",
      "location_id",
      "inventory_item_id",
      "quantity",
      "line_item_id",
      "description",
      "created_by",
    ],
    prefix
  )

  const { offset, quantity, inventory_item_id: _inventoryItemId, ...params } = raw

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    quantity: quantity ? JSON.parse(quantity) : undefined,
    ...params,
    ...(inventoryItemId ? { inventory_item_id: inventoryItemId } : {}),
  }

  return {
    searchParams,
    raw,
  }
}
