import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heading } from "@medusajs/ui"

import { useOrder, useOrderPreview } from "../../../hooks/api/orders"
import { RouteDrawer } from "../../../components/modals"
import { OrderReceiveReturnForm } from "./components/order-receive-return-form"
import { useReturn } from "../../../hooks/api/returns"

export function OrderReceiveReturn() {
  const { id, return_id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Type guards
  if (!id || !return_id) {
    navigate('/orders', { replace: true })
    return null
  }

  /**
   * HOOKS
   */

  const { order } = useOrder(id, { fields: "+currency_code,*items" })
  const { order: preview } = useOrderPreview(id)
  const { return: orderReturn } = useReturn(return_id, {
    fields: "*items.item,*items.item.variant,*items.item.variant.product",
  })

  // Debug: Log return data
  console.log("🔍 useReturn hook result:", {
    returnId: return_id,
    orderReturn,
    hasOrderReturn: !!orderReturn,
    orderReturnId: orderReturn?.id,
    orderReturnStatus: orderReturn?.status
  }) // TODO: fix API needs to return 404 if return not exists and not an empty object

  // Note: Automatic initiation disabled due to order change conflicts
  // The return receive process is now handled manually through the form

  const ready = order && orderReturn && preview

  if (!ready) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>
            {t("orders.returns.receive.title", {
              returnId: return_id?.slice(-7),
            })}
          </Heading>
        </RouteDrawer.Header>
        <RouteDrawer.Body>
          <div className="flex items-center justify-center h-32">
            <span className="text-ui-fg-muted">Loading...</span>
          </div>
        </RouteDrawer.Body>
      </RouteDrawer>
    )
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>
          {t("orders.returns.receive.title", {
            returnId: return_id?.slice(-7),
          })}
        </Heading>
      </RouteDrawer.Header>
      <OrderReceiveReturnForm
        order={order}
        orderReturn={orderReturn}
        preview={preview}
      />
    </RouteDrawer>
  )
}
