import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { getOrderPaymentStatus } from "../../../../../lib/order-helpers"
import { StatusCell } from "../../common/status-cell"

type PaymentStatusCellProps = {
  status: HttpTypes.AdminOrder["payment_status"]
}

export const PaymentStatusCell = ({ status }: PaymentStatusCellProps) => {
  const { t } = useTranslation()

  // Only use fallback if status is truly null/undefined, not for valid status strings
  if (!status) {
    const { label, color } = getOrderPaymentStatus(t, "not_paid")
    return <StatusCell color={color}>{label}</StatusCell>
  }

  const { label, color } = getOrderPaymentStatus(t, status)
  
  
  return <StatusCell color={color}>{label}</StatusCell>
}

export const PaymentStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{t("fields.payment")}</span>
    </div>
  )
}
