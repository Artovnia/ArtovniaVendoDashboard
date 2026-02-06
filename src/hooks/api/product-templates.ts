import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchQuery } from '../../lib/client/client'

/**
 * Template GPSR data shape
 */
export type TemplateGPSR = {
  producer_name?: string
  producer_address?: string
  producer_contact?: string
  importer_name?: string
  importer_address?: string
  importer_contact?: string
  instructions?: string
  certificates?: string
}

/**
 * Template option shape
 */
export type TemplateOption = {
  title: string
  values: string[]
  /** Per-value default prices, keyed by value string, e.g. { "100x120cm": { "default": 500 } } */
  value_prices?: Record<string, Record<string, number>>
}

/**
 * Template dimensions shape
 */
export type TemplateDimensions = {
  weight?: number
  length?: number
  width?: number
  height?: number
}

/**
 * Template data payload
 */
export type TemplateData = {
  options?: TemplateOption[]
  gpsr?: TemplateGPSR
  shipping_profile_id?: string
  categories?: string[]
  default_prices?: Record<string, number>
  dimensions?: TemplateDimensions
  description_template?: string
  material?: string
  origin_country?: string
}

/**
 * Product template entity
 */
export type ProductTemplate = {
  id: string
  name: string
  description?: string | null
  template_data: TemplateData
  is_default: boolean
  created_at: string
  updated_at: string
}

const PRODUCT_TEMPLATES_QUERY_KEY = 'product-templates'

/**
 * Fetch all product templates for the authenticated seller
 */
export const useProductTemplates = (params?: { q?: string }) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCT_TEMPLATES_QUERY_KEY, params],
    queryFn: async () => {
      const query: Record<string, string | number> = {}
      if (params?.q) query.q = params.q

      return await fetchQuery('/vendor/product-templates', {
        method: 'GET',
        query,
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    product_templates: (data?.product_templates || []) as ProductTemplate[],
    count: data?.count || 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Fetch a single product template by ID
 */
export const useProductTemplate = (id: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCT_TEMPLATES_QUERY_KEY, id],
    queryFn: async () => {
      return await fetchQuery(`/vendor/product-templates/${id}`, {
        method: 'GET',
      })
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    product_template: data?.product_template as ProductTemplate | undefined,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Create a new product template
 */
export const useCreateProductTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      template_data: TemplateData
      is_default?: boolean
    }) => {
      return await fetchQuery('/vendor/product-templates', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_TEMPLATES_QUERY_KEY] })
    },
  })
}

/**
 * Update an existing product template
 */
export const useUpdateProductTemplate = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name?: string
      description?: string | null
      template_data?: TemplateData
      is_default?: boolean
    }) => {
      return await fetchQuery(`/vendor/product-templates/${id}`, {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_TEMPLATES_QUERY_KEY] })
    },
  })
}

/**
 * Delete a product template
 */
export const useDeleteProductTemplate = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await fetchQuery(`/vendor/product-templates/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_TEMPLATES_QUERY_KEY] })
    },
  })
}

/**
 * Create a product template from an existing product
 */
export const useCreateTemplateFromProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      product_id: string
      name: string
      description?: string
    }) => {
      const { product_id, ...body } = payload
      return await fetchQuery(`/vendor/product-templates/from-product/${product_id}`, {
        method: 'POST',
        body,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_TEMPLATES_QUERY_KEY] })
    },
  })
}
