import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createDataGridHelper } from "../../../../components/data-grid"
import { DataGridReadOnlyCell } from "../../../../components/data-grid/components"
import { DataGridTogglableNumberCell } from "../../../../components/data-grid/components/data-grid-toggleable-number-cell"
import { InventoryStockSchema } from "../schema"
import { Text } from "@medusajs/ui"

const helper = createDataGridHelper<
  HttpTypes.AdminInventoryItem,
  InventoryStockSchema
>()

export const useInventoryStockColumns = (
  locations: HttpTypes.AdminStockLocation[] = []
) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      helper.column({
        id: "title",
        name: "Title",
        header: "Title",
        cell: (context) => {
          const item = context.row.original
          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={item.title || undefined}>{item.title || "-"}</span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "sku",
        name: "SKU",
        header: "SKU",
        cell: (context) => {
          const item = context.row.original

          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={item.sku || undefined}>{item.sku || "-"}</span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      // Add columns for warehouse, reservations, and available quantities
      ...locations.map((location) => [
        helper.column({
          id: `location_${location.id}`,
          name: `${location.name}`,
          header: `${location.name}`,
          field: (context) => {
            const item = context.row.original
            return `inventory_items.${item.id}.locations.${location.id}` as const
          },
          type: "togglable-number",
          cell: (context) => {
            return (
              <DataGridTogglableNumberCell
                context={context}
                disabledToggleTooltip={t(
                  "inventory.stock.disabledToggleTooltip"
                )}
              />
            )
          },
        }),
        helper.column({
          id: `warehouse_${location.id}`,
          name: `${t("inventory.inWarehouse")}`,
          header: `${t("inventory.inWarehouse")}`,
          cell: (context) => {
            const item = context.row.original
            const level = item.location_levels?.find(
              (level) => level.location_id === location.id
            )
            const inWarehouse = level?.stocked_quantity || 0
            
            return (
              <DataGridReadOnlyCell context={context} color="normal">
                <Text size="small">{inWarehouse}</Text>
              </DataGridReadOnlyCell>
            )
          },
        }),
        helper.column({
          id: `reservations_${location.id}`,
          name: `${t("inventory.reserved")}`,
          header: `${t("inventory.reserved")}`,
          cell: (context) => {
            const item = context.row.original
            const level = item.location_levels?.find(
              (level) => level.location_id === location.id
            )
            const reserved = level?.reserved_quantity || 0
            
            return (
              <DataGridReadOnlyCell context={context} color="normal">
                <Text size="small">{reserved}</Text>
              </DataGridReadOnlyCell>
            )
          },
        }),
        helper.column({
          id: `available_${location.id}`,
          name: `${t("inventory.available")}`,
          header: `${t("inventory.available")}`,
          cell: (context) => {
            const item = context.row.original
            const level = item.location_levels?.find(
              (level) => level.location_id === location.id
            )
            const stocked = level?.stocked_quantity || 0
            const reserved = level?.reserved_quantity || 0
            const available = Math.max(0, stocked - reserved)
            
            return (
              <DataGridReadOnlyCell context={context} color="normal">
                <Text size="small">{available}</Text>
              </DataGridReadOnlyCell>
            )
          },
        }),
      ]).flat(),
    ],
    [locations, t]
  )
}
