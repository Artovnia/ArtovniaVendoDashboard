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
            // FIXED: Amounts are stored as full currency units (PLN), not cents
            // Database stores amounts as DECIMAL, not as cents
            return new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: currencyCode,
            }).format(amount)
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
      columnHelper.accessor("data", {
        id: "status",
        header: t("fields.status"),
        enableSorting: false,
        cell: ({ row }) => {
          // FIXED: Use status column first (database), fallback to data.payout_status (legacy)
          const payoutStatus = row.original.status || row.original.data?.payout_status || 'PENDING'
          
          const getStatusColor = (status: string) => {
            switch (status?.toUpperCase()) {
              case 'COMPLETED':
              case 'PAID':
                return 'green'
              case 'PROCESSING':
              case 'IN_TRANSIT':
                return 'blue'
              case 'PENDING':
              case 'PENDING_BATCH':
                return 'orange'
              case 'FAILED':
              case 'CANCELED':
                return 'red'
              default:
                return 'grey'
            }
          }
          
          const getStatusLabel = (status: string) => {
            const statusUpper = status?.toUpperCase() || 'PENDING'
            // Try to translate, fallback to status itself
            const translationKey = `payout.status.${statusUpper.toLowerCase()}`
            const translated = t(translationKey)
            return translated === translationKey ? statusUpper : translated
          }
          
          return (
            <Badge color={getStatusColor(payoutStatus)} size="2xsmall">
              {getStatusLabel(payoutStatus)}
            </Badge>
          )
        },
      }),
    ],
    [t]
  )
}
