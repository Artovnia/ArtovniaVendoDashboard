const DEFAULT_PROPERTIES = [
  "id",
  "status",
  "created_at",
  "email",
  "display_id",
  "payment_status",
  "fulfillment_status",
  "total",
  "currency_code",
]

const DEFAULT_RELATIONS = [
  "*customer", 
  "*sales_channel",
  "*payment_collections",
  "*payment_collections.payments",
  "*payment_collections.payments.refunds"  // ← CRITICAL: needed to calculate refunded status
]

export const DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`
