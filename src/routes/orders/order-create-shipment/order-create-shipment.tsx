import { useParams, useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { useOrder } from "../../../hooks/api/orders"
import { OrderCreateShipmentForm } from "./components/order-create-shipment-form"

export function OrderCreateShipment() {
  const { id, f_id } = useParams()
  const [searchParams] = useSearchParams()
  const groupParam = searchParams.get('group')

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields: "*fulfillments,*fulfillments.items,*fulfillments.labels",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && order

  // If group parameter exists, get all fulfillments in the group
  const fulfillments = groupParam
    ? groupParam.split(',').map(fId => order?.fulfillments?.find((f: any) => f.id === fId)).filter(Boolean)
    : [order?.fulfillments?.find((f: any) => f.id === f_id)].filter(Boolean)

  return (
    <RouteFocusModal>
      {ready && (
        <OrderCreateShipmentForm
          order={order}
          fulfillments={fulfillments as any[]}
        />
      )}
    </RouteFocusModal>
  )
}
