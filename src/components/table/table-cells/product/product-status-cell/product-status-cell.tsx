import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { HttpTypes } from "@medusajs/types"

type ProductStatusCellProps = {
  status: HttpTypes.AdminProductStatus
}

export const ProductStatusCell = ({ status }: ProductStatusCellProps) => {
  const { t } = useTranslation()

  const [color, text] = {
    draft: ["grey", t("productStatus.draft")],
    proposed: ["orange", t("productStatus.proposed")],
    published: ["green", t("productStatus.published")],
    rejected: ["red", t("productStatus.rejected")],
  }[status] as ["grey" | "orange" | "green" | "red", string]

  return <StatusCell color={color}>{text}</StatusCell>
}

export const ProductStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.status")}</span>
    </div>
  )
}
