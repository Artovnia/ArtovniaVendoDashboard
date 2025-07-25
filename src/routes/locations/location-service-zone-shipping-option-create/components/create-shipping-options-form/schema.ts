import { z } from 'zod';
import { ShippingOptionPriceType } from '../../../common/constants';
import { ConditionalPriceSchema } from '../../../common/schema';

export type CreateShippingOptionSchema = z.infer<
  typeof CreateShippingOptionSchema
>;

export const CreateShippingOptionDetailsSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price_type: z.nativeEnum(ShippingOptionPriceType, { errorMap: () => ({ message: "Price type is required" }) }),
  enabled_in_store: z.boolean(),
  shipping_profile_id: z.string().min(1, { message: "Shipping profile is required" }),
  provider_id: z.string().min(1, { message: "Fulfillment provider is required" }),
  fulfillment_option_id: z.string().min(1, { message: "Fulfillment option is required" }),
});

export const ShippingOptionConditionalPriceSchema =
  z.object({
    conditional_region_prices: z.record(
      z.string(),
      z.array(ConditionalPriceSchema).optional()
    ),
    conditional_currency_prices: z.record(
      z.string(),
      z.array(ConditionalPriceSchema).optional()
    ),
  });

export type ShippingOptionConditionalPriceSchemaType =
  z.infer<typeof ShippingOptionConditionalPriceSchema>;

export const CreateShippingOptionSchema = z
  .object({
    region_prices: z.record(
      z.string(),
      z.string().optional()
    ),
    currency_prices: z.record(
      z.string(),
      z.string().optional()
    ),
  })
  .merge(CreateShippingOptionDetailsSchema)
  .merge(ShippingOptionConditionalPriceSchema);

export type CreateShippingOptionSchemaType = z.infer<
  typeof CreateShippingOptionSchema
>;