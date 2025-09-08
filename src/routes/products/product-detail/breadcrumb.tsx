import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { useProduct } from "../../../hooks/api"
import { PRODUCT_DETAIL_FIELDS } from "./constants"

type ProductDetailBreadcrumbProps = UIMatch<HttpTypes.AdminProductResponse>

export const ProductDetailBreadcrumb = (
  props: ProductDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { product, isLoading, error } = useProduct(
    id!,
    {
      fields: PRODUCT_DETAIL_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  // Handle loading state with fallback
  if (isLoading && !product) {
    return <span>Loading...</span>
  }

  // Handle error state with fallback
  if (error && !product) {
    return <span>Product</span>
  }

  // Handle missing product with fallback
  if (!product) {
    return <span>Product</span>
  }

  // CRITICAL FIX: Handle undefined/null title values explicitly
  const title = product.title
  if (title === undefined || title === null || title === 'undefined' || title === 'null') {
    console.warn(`Product ${id} has invalid title:`, title)
    return <span>Product</span>
  }
  
  // Handle empty string title
  const trimmedTitle = String(title).trim()
  if (!trimmedTitle) {
    return <span>Untitled Product</span>
  }

  return <span>{trimmedTitle}</span>
}
