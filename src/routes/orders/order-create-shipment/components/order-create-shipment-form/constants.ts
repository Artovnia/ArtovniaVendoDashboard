import { z } from "zod"

export const CreateShipmentSchema = z.object({
  labels: z.array(
    z.object({
      tracking_number: z.string(),
      carrier: z.string().optional(),
      // TODO: this 2 are not optional in the API
      tracking_url: z.string().optional(),
      label_url: z.string().optional(),
    })
  ),
  send_notification: z.boolean().optional(),
  invoice_url: z.string().optional(),
  invoice_name: z.string().optional(),
})
