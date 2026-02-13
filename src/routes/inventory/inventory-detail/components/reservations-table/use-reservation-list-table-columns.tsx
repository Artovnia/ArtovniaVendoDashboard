import { HttpTypes } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CreatedAtCell } from "../../../../../components/table/table-cells/common/created-at-cell"
import { PlaceholderCell } from "../../../../../components/table/table-cells/common/placeholder-cell"
import { TextCell, TextHeader } from "../../../../../components/table/table-cells/common/text-cell"
import { ReservationActions } from "./reservation-actions"

/**
 * Adds missing properties to the InventoryItemDTO type.
 */
export interface ExtendedReservationItem extends HttpTypes.AdminReservation {
  order?: { order_id: string; display_id: number } | null
  location_name?: string | null
}

const columnHelper = createColumnHelper<ExtendedReservationItem>()

export const useReservationTableColumn = ({ sku }: { sku: string }) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "sku",
        header: () => <TextHeader text={t("fields.sku")} />,
        cell: () => {
          return (
            <TextCell text={sku} />
          )
        },
      }),
      columnHelper.accessor("order", {
        header: () => <TextHeader text={t("inventory.reservation.orderID")} />,
        cell: ({ getValue }) => {
          const order = getValue()

          if (!order?.display_id) {
            return <PlaceholderCell />
          }

          return (
            <TextCell text={`#${order.display_id}`} />
          )
        },
      }),
      columnHelper.accessor("description", {
        header: () => <TextHeader text={t("fields.description")} />,
        cell: ({ getValue }) => {
          const description = getValue()

          if (!description) {
            return <PlaceholderCell />
          }

          return (
            <TextCell text={description} />
          )
        },
      }),
      columnHelper.accessor("location_name", {
        header: () => <TextHeader text={t("inventory.reservation.location")} />,
        cell: ({ getValue }) => {
          const locationName = getValue()

          if (!locationName) {
            return <PlaceholderCell />
          }

          return (
            <TextCell text={locationName} />
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text={t("fields.createdAt")} />,
        cell: ({ getValue }) => <CreatedAtCell date={getValue()} />,
      }),
      columnHelper.accessor("quantity", {
        header: () => <TextHeader text={t("fields.quantity")} align="right" />,
        cell: ({ getValue }) => {
          return <TextCell text={getValue()} align="right" />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ReservationActions reservation={row.original} />,
      }),
    ],
    [t]
  )
}
