import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { getOrderPaymentStatus, calculateActualPaymentStatus } from "../../../../../lib/order-helpers"
import { StatusCell } from "../../common/status-cell"

type PaymentStatusCellProps = {
  status: HttpTypes.AdminOrder["payment_status"]
  order?: HttpTypes.AdminOrder
}

export const PaymentStatusCell = ({ status, order }: PaymentStatusCellProps) => {
  const { t } = useTranslation()

  // CRITICAL FIX: Calculate actual status from payment collections for split orders
  // This ensures refunded orders show correct status even when order.payment_status is stale
  let actualStatus = status
  
  if (order) {
    actualStatus = calculateActualPaymentStatus(order)
  }

  // Only use fallback if status is truly null/undefined, not for valid status strings
  if (!actualStatus) {
    const { label, color } = getOrderPaymentStatus(t, "not_paid")
    return <StatusCell color={color}>{label}</StatusCell>
  }

  const { label, color } = getOrderPaymentStatus(t, actualStatus)
  
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
