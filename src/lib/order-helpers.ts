import { TFunction } from "i18next"
import { HttpTypes } from "@medusajs/types"

export const getCanceledOrderStatus = (
  t: TFunction<"translation">,
  status: string
): { label: string; color: "red" } | null => {
  if (status === "canceled") {
    return { label: t("orders.status.canceled"), color: "red" }
  }

  return null
}

/**
 * Calculate actual payment status from payment collections and refunds
 * This is critical for split orders where order.payment_status may not reflect refunds
 */
export const calculateActualPaymentStatus = (
  order: HttpTypes.AdminOrder
): string => {
  // If no payment collections, use the order's payment_status
  if (!order.payment_collections || order.payment_collections.length === 0) {
    return order.payment_status || "not_paid"
  }

  let totalAmount = 0
  let totalRefunded = 0
  let totalCaptured = 0
  let hasAuthorized = false
  let hasCanceled = false

  // Iterate through all payment collections
  for (const collection of order.payment_collections) {
    totalAmount += collection.amount || 0

    // Check payments within this collection
    if (collection.payments && collection.payments.length > 0) {
      for (const payment of collection.payments) {
        // Sum captured amounts
        if (payment.captured_at) {
          totalCaptured += payment.amount || 0
        }
        
        // Check for authorized payments (authorized but not yet captured)
        if ((payment.authorized_amount || 0) > 0 && !payment.captured_at) {
          hasAuthorized = true
        }

        // Check for canceled payments
        if (payment.canceled_at) {
          hasCanceled = true
        }

        // Sum refunded amounts from this payment
        if (payment.refunds && payment.refunds.length > 0) {
          for (const refund of payment.refunds) {
            totalRefunded += refund.amount || 0
          }
        }
      }
    }
  }

  // Determine status based on amounts
  if (totalRefunded > 0) {
    if (totalRefunded >= totalCaptured) {
      return "refunded"
    }
    return "partially_refunded"
  }

  if (totalCaptured > 0) {
    if (totalCaptured >= totalAmount) {
      return "captured"
    }
    return "partially_captured"
  }

  if (hasAuthorized) {
    return "authorized"
  }

  if (hasCanceled) {
    return "canceled"
  }

  // Fallback to order's payment_status
  return order.payment_status || "not_paid"
}

export const getOrderPaymentStatus = (
  t: TFunction<"translation">,
  status: string
) => {

  const statusMap = {
    not_paid: [t("orders.payment.status.notPaid"), "red"],
    authorized: [t("orders.payment.status.authorized"), "orange"],
    partially_authorized: [
      t("orders.payment.status.partiallyAuthorized"),
      "red",
    ],
    awaiting: [t("orders.payment.status.awaiting"), "orange"],
    captured: [t("orders.payment.status.captured"), "green"],
    refunded: [t("orders.payment.status.refunded"), "green"],
    partially_refunded: [
      t("orders.payment.status.partiallyRefunded"),
      "orange",
    ],
    partially_captured: [
      t("orders.payment.status.partiallyCaptured"),
      "orange",
    ],
    canceled: [t("orders.payment.status.canceled"), "red"],
    requires_action: [t("orders.payment.status.requiresAction"), "orange"],
  } as Record<string, [string, "red" | "orange" | "green"]>

  const availableStatuses = Object.keys(statusMap)
  const statusExists = availableStatuses.includes(status)

  const statusData = statusMap[status] || [status || "Unknown", "red"]
  const [label, color] = statusData

  return { label, color }
}

export const getOrderFulfillmentStatus = (
  t: TFunction<"translation">,
  status: string
) => {
  const statusMap = {
    not_fulfilled: [t("orders.fulfillment.status.notFulfilled"), "red"],
    partially_fulfilled: [
      t("orders.fulfillment.status.partiallyFulfilled"),
      "orange",
    ],
    fulfilled: [t("orders.fulfillment.status.fulfilled"), "green"],
    partially_shipped: [
      t("orders.fulfillment.status.partiallyShipped"),
      "orange",
    ],
    shipped: [t("orders.fulfillment.status.shipped"), "green"],
    delivered: [t("orders.fulfillment.status.delivered"), "green"],
    partially_delivered: [
      t("orders.fulfillment.status.partiallyDelivered"),
      "orange",
    ],
    partially_returned: [
      t("orders.fulfillment.status.partiallyReturned"),
      "orange",
    ],
    returned: [t("orders.fulfillment.status.returned"), "green"],
    canceled: [t("orders.fulfillment.status.canceled"), "red"],
    requires_action: [t("orders.fulfillment.status.requiresAction"), "orange"],
  } as Record<string, [string, "red" | "orange" | "green"]>

  // Handle case where status is not found in the map
  const statusData = statusMap[status] || [status || "Unknown", "red"]
  const [label, color] = statusData

  return { label, color }
}
