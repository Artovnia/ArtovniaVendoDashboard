import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import React from "react"

import { RouteDrawer } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "../product-detail/constants"
import { ProductOrganizationForm } from "./components/product-organization-form"
import { useQueryClient } from "@tanstack/react-query"

export const ProductOrganization = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  // CRITICAL FIX: Force refetch if categories are missing
  // React Query cache inconsistency fix
  React.useEffect(() => {
    if (product && !product.categories && !isLoading) {
      queryClient.invalidateQueries({ 
        queryKey: ['products', 'detail', id] 
      });
    }
  }, [product, isLoading, id, queryClient]);

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.organization.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && product && <ProductOrganizationForm product={product} />}
    </RouteDrawer>
  )
}
