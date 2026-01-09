import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Text, Badge } from "@medusajs/ui"

import { PenaltyData } from "../../../../hooks/api/payouts"

const columnHelper = createColumnHelper<PenaltyData>()

export const usePenaltyTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      
      columnHelper.accessor("amount", {
        header: t("payout.earnings.penalties.amount"),
        enableSorting: true,
        cell: ({ getValue, row }) => {
          const amount = getValue()
          const currencyCode = row.original.currency_code || 'PLN'
          
          const formatCurrency = (amount: number, currencyCode: string) => {
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
      columnHelper.accessor("remaining_amount", {
        header: t("payout.earnings.penalties.remaining"),
        enableSorting: true,
        cell: ({ getValue, row }) => {
          const remaining = getValue()
          const currencyCode = row.original.currency_code || 'PLN'
          
          const formatCurrency = (amount: number, currencyCode: string) => {
            return new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: currencyCode,
            }).format(amount)
          }

          return (
            <Text 
              size="small" 
              weight="plus"
              className={remaining > 0 ? 'text-ui-fg-error' : 'text-ui-fg-success'}
            >
              {formatCurrency(remaining, currencyCode)}
            </Text>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: t("payout.earnings.penalties.status"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const status = getValue()
          
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'deducted':
                return 'green'
              case 'partially_deducted':
                return 'orange'
              case 'pending':
                return 'red'
              case 'paid':
                return 'blue'
              case 'waived':
                return 'grey'
              default:
                return 'grey'
            }
          }
          
          return (
            <Badge color={getStatusColor(status)} size="2xsmall">
              {t(`payout.earnings.penalties.statusValues.${status}` as any)}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("payout.earnings.penalties.date"),
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue()
          return (
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(date).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )
        },
      }),
    ],
    [t]
  )
}
