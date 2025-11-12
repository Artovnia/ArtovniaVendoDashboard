import { AdminShippingProfileResponse } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ShippingOptionsRowActions } from "./shipping-options-row-actions"
import { translateShippingProfileKey } from "../../../../../lib/shipping-profile-i18n"

const columnHelper =
  createColumnHelper<AdminShippingProfileResponse["shipping_profile"]>()

export const useShippingProfileTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("fields.name"),
        cell: (cell) => translateShippingProfileKey(cell.getValue(), false, t),
      }),
      columnHelper.accessor("type", {
        header: t("fields.type"),
        cell: (cell) => translateShippingProfileKey(cell.getValue(), true, t),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ShippingOptionsRowActions profile={row.original} />,
      }),
    ],
    [t]
  )
}
