import { z } from "zod"
import { EditProductMediaSchema, ProductCreateSchema, ProductCreateOptionSchema, ProductCreateVariantSchema } from "./constants"

export type ProductCreateSchemaType = z.infer<ReturnType<typeof ProductCreateSchema>>

export type EditProductMediaSchemaType = z.infer<typeof EditProductMediaSchema>

export type ProductCreateFormType = Omit<
  ProductCreateSchemaType,
  'options' | 'variants'
> & {
  options: ProductCreateOptionSchema[]
  variants: ProductCreateVariantSchema[]
}
