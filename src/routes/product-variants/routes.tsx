import { RouteObject } from 'react-router-dom'

const productVariantRoutes: RouteObject[] = [
  {
    path: '/product-variants/:product_id/variants/:variant_id/colors',
    lazy: async () => {
      const module = await import('./product-variant-colors')
      return {
        Component: module.Component,
        loader: module.loader,
        handle: {
          breadcrumb: module.Breadcrumb,
        },
      }
    },
  }
]

export default productVariantRoutes
