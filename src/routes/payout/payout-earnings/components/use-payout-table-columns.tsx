import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Text, Badge } from "@medusajs/ui"

import { PayoutData } from "../../../../hooks/api/payouts"

const columnHelper = createColumnHelper<PayoutData>()

export const usePayoutTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("fields.id"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const id = getValue()
          return (
            <Text size="small" className="font-mono">
              {id.slice(-8)}
            </Text>
          )
        },
      }),
      columnHelper.accessor("amount", {
        header: t("fields.amount"),
        enableSorting: true,
        cell: ({ getValue, row }) => {
          const amount = getValue()
          const currencyCode = row.original.currency_code || 'PLN'
          
          const formatCurrency = (amount: number, currencyCode: string) => {
            return new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: currencyCode,
            }).format(amount / 100) // Assuming amounts are in cents
          }

          return (
            <Text size="small" weight="plus">
              {formatCurrency(amount, currencyCode)}
            </Text>
          )
        },
      }),
      columnHelper.accessor("currency_code", {
        header: t("fields.currency"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const currency = getValue()
          return (
            <Badge size="2xsmall" className="uppercase">
              {currency}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue()
          return (
            <Text size="small">
              {new Date(date).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: t("fields.status"),
        cell: () => {
          return (
            <Badge color="green" size="2xsmall">
              {t("payout.status.completed")}
            </Badge>
          )
        },
      }),
    ],
    [t]
  )
}
