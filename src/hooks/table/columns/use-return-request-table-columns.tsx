import { Badge } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ReturnRequest } from "../../api/return-requests"
import { useDate } from "../../use-date"

const columnHelper = createColumnHelper<ReturnRequest>()

export const useReturnRequestTableColumns = () => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  return useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: "#",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination
          return pageIndex * pageSize + row.index + 1
        },
        size: 50,
      }),
      columnHelper.accessor("created_at", {
        header: t("requests.returns.table.date"),
        cell: ({ getValue }) => {
          const date = getValue()
          if (!date) return "-"
          try {
            const dateObj = date instanceof Date ? date : new Date(date)
            if (isNaN(dateObj.getTime())) return "-"
            return getFullDate({ date: dateObj, includeTime: true })
          } catch (e) {
            return "-"
          }
        },
      }),
      columnHelper.accessor("order.customer", {
        header: t("requests.returns.table.customer"),
        cell: ({ getValue }) => {
          const customer = getValue()
          if (!customer) return "-"
          return `${customer.first_name} ${customer.last_name}`
        },
      }),
      columnHelper.accessor("order.display_id", {
        header: t("requests.returns.table.orderNumber"),
        cell: ({ getValue }) => {
          const displayId = getValue()
          if (!displayId) return "-"
          return `#${displayId}`
        },
      }),
      columnHelper.accessor("customer_note", {
        header: t("requests.returns.table.customerNote"),
        cell: ({ getValue }) => {
          const note = getValue()
          return note || "-"
        },
      }),
      columnHelper.accessor("status", {
        header: t("requests.returns.table.status"),
        cell: ({ getValue }) => {
          const status = getValue()
          switch (status) {
            case "pending":
              return <Badge color="orange">{t("requests.returns.status.pending")}</Badge>
            case "approved":
              return <Badge color="green">{t("requests.returns.status.approved")}</Badge>
            case "refunded":
              return <Badge color="green">{t("requests.returns.status.refunded")}</Badge>
            case "escalated":
              return <Badge color="red">{t("requests.returns.status.escalated")}</Badge>
            case "withdrawn":
              return <Badge color="grey">{t("requests.returns.status.withdrawn")}</Badge>
            default:
              return <Badge color="grey">{status}</Badge>
          }
        },
      }),
    ],
    [t, getFullDate]
  )
}
