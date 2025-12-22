import { z } from "zod"

// This schema is for the frontend form only
// The actual API expects only: items, requires_shipping, location_id
export const CreateFulfillmentSchema = z.object({
  quantity: z.record(z.string(), z.number()),
  location_id: z.string(),
  shipping_option_id: z.string().optional(), // Used for validation but not sent to API (legacy single parcel)
  send_notification: z.boolean().optional(), // Used for UI only, not sent to API
  // Multi-parcel support
  selected_parcels: z.array(z.number()).optional(), // Parcel numbers to fulfill
  use_parcels: z.boolean().optional(), // Whether to use parcel-based fulfillment
})
