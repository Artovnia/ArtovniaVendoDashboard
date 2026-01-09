import { memo } from "react"
import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { HttpTypes } from "@medusajs/types"

type ProductStatusCellProps = {
  status: HttpTypes.AdminProductStatus
}

export const ProductStatusCell = memo(({ status }: ProductStatusCellProps) => {
  const { t } = useTranslation()

  // Defensive: handle undefined or invalid status
  const statusMap = {
    draft: ["grey", t("productStatus.draft")],
    proposed: ["orange", t("productStatus.proposed")],
    published: ["green", t("productStatus.published")],
    rejected: ["red", t("productStatus.rejected")],
  } as const

  const statusData = status ? statusMap[status] : statusMap.draft
  const [color, text] = statusData || ["grey", t("productStatus.draft")]

  return <StatusCell color={color}>{text}</StatusCell>
}, (prevProps, nextProps) => prevProps.status === nextProps.status)

export const ProductStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.status")}</span>
    </div>
  )
}
