import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sdk } from '../../lib/client'

// Types
// Note: seller_id removed - now managed via link table on backend
export interface BaseLinkerConnection {
  id: string
  api_token: string
  inventory_id: number
  product_sync_enabled: boolean
  stock_sync_enabled: boolean
  order_sync_enabled: boolean
  fulfillment_sync_enabled: boolean
  auto_sync_products: boolean
  auto_sync_stock: boolean
  auto_sync_orders: boolean
  stock_sync_interval_minutes: number
  stock_sync_direction: 'to_baselinker' | 'from_baselinker' | 'bidirectional'
  status: 'active' | 'inactive' | 'error'
  created_at: string
  updated_at: string
  metadata?: {
    gpsr_defaults?: {
      gpsr_producer_name?: string
      gpsr_producer_address?: string
      gpsr_producer_contact?: string
      gpsr_instructions?: string
    }
    [key: string]: any
  }
}

export interface CreateConnectionInput {
  api_token: string
  inventory_id: number
  product_sync_enabled?: boolean
  stock_sync_enabled?: boolean
  order_sync_enabled?: boolean
  fulfillment_sync_enabled?: boolean
  auto_sync_products?: boolean
  auto_sync_stock?: boolean
  auto_sync_orders?: boolean
  stock_sync_interval_minutes?: number
  stock_sync_direction?: 'to_baselinker' | 'from_baselinker' | 'bidirectional'
  metadata?: {
    gpsr_defaults?: {
      gpsr_producer_name?: string
      gpsr_producer_address?: string
      gpsr_producer_contact?: string
      gpsr_instructions?: string
    }
    [key: string]: any
  }
}

export interface ImportProductInput {
  bl_product_id: string
  connection_id?: string
  default_currency?: string
  default_status?: 'draft' | 'proposed'
  strict_gpsr?: boolean
}

export interface ImportBulkInput {
  bl_product_ids?: string[]
  connection_id?: string
  batch_size?: number
  default_currency?: string
  default_status?: 'draft' | 'proposed'
  strict_gpsr?: boolean
  require_ce?: boolean
  category_mapping?: Record<string, string>
  default_shipping_profile_id?: string
  product_assignments?: Array<{
    bl_product_id: string
    category_id?: string
    shipping_profile_id?: string
  }>
  // Grouped products for variant import
  grouped_products?: Array<{
    group_id: string
    group_name: string
    bl_product_ids: string[]
    options: Array<{ title: string; values: string[] }>
    variants: Array<{
      bl_product_id: string
      option_values: Record<string, string>
      sku: string
      price: number
      quantity: number
      ean?: string | null
      images?: string[]
    }>
    category_id?: string
    shipping_profile_id?: string
  }>
}

export interface SyncStockInput {
  direction: 'to_baselinker' | 'from_baselinker'
  connection_id?: string
  product_ids?: string[]
}

// Query keys
export const baselinkerKeys = {
  all: ['baselinker'] as const,
  connections: () => [...baselinkerKeys.all, 'connections'] as const,
  connection: (id: string) => [...baselinkerKeys.connections(), id] as const,
}

// Hooks
export const useBaseLinkerConnections = () => {
  return useQuery({
    queryKey: baselinkerKeys.connections(),
    queryFn: async () => {
      const response = await sdk.client.fetch<{ connections: BaseLinkerConnection[] }>(
        '/vendor/baselinker/connections',
        { method: 'GET' }
      )
      return response.connections
    },
  })
}

export const useBaseLinkerConnection = (id: string) => {
  return useQuery({
    queryKey: baselinkerKeys.connection(id),
    queryFn: async () => {
      const response = await sdk.client.fetch<{ connection: BaseLinkerConnection }>(
        `/vendor/baselinker/connections/${id}`,
        { method: 'GET' }
      )
      return response.connection
    },
    enabled: !!id,
  })
}

export const useCreateBaseLinkerConnection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateConnectionInput) => {
      const response = await sdk.client.fetch<{ connection: BaseLinkerConnection }>(
        '/vendor/baselinker/connections',
        {
          method: 'POST',
          body: data,
        }
      )
      return response.connection
    },
    onSuccess: () => {
      // Invalidate all baselinker queries to ensure fresh data after connection creation
      queryClient.invalidateQueries({ queryKey: baselinkerKeys.all })
    },
  })
}

export const useUpdateBaseLinkerConnection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateConnectionInput> }) => {
      const response = await sdk.client.fetch<{ connection: BaseLinkerConnection }>(
        `/vendor/baselinker/connections/${id}`,
        {
          method: 'POST',
          body: data,
        }
      )
      return response.connection
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: baselinkerKeys.connections() })
      queryClient.invalidateQueries({ queryKey: baselinkerKeys.connection(variables.id) })
    },
  })
}

export const useDeleteBaseLinkerConnection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/vendor/baselinker/connections/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: baselinkerKeys.connections() })
    },
  })
}

export const useImportProduct = () => {
  return useMutation({
    mutationFn: async (data: ImportProductInput) => {
      const response = await sdk.client.fetch<{
        import_record_id: string
        product_request: any
        gpsr_valid: boolean
        images_processed: number
        images_failed: number
      }>('/vendor/baselinker/import/product', {
        method: 'POST',
        body: data,
      })
      return response
    },
  })
}

export const useImportBulk = () => {
  return useMutation({
    mutationFn: async (data: ImportBulkInput) => {
      const response = await sdk.client.fetch<{
        total_products: number
        successful_imports: number
        failed_imports: number
        results: any[]
      }>('/vendor/baselinker/import/bulk', {
        method: 'POST',
        body: data,
      })
      return response
    },
  })
}

export const useSyncStock = () => {
  return useMutation({
    mutationFn: async (data: SyncStockInput) => {
      const response = await sdk.client.fetch<{
        sync_record_id: string
        total_items: number
        updated_count: number
        failed_count: number
      }>('/vendor/baselinker/sync/stock', {
        method: 'POST',
        body: data,
      })
      return response
    },
  })
}

// New hooks for two-step import flow
export const useProductsPreview = (connectionId?: string) => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'products-preview', connectionId],
    queryFn: async () => {
      const url = connectionId 
        ? `/vendor/baselinker/products/preview?connection_id=${connectionId}`
        : '/vendor/baselinker/products/preview'
      
      const response = await sdk.client.fetch<{
        products: any[]
        categories: any[]
        connection: { id: string; inventory_id: number }
      }>(url, { method: 'GET' })
      
      return response
    },
    enabled: false, // Only fetch when explicitly called
  })
}

export const useCategoryMappings = () => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'category-mappings'],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        mappings: any[]
        last_updated: string | null
      }>('/vendor/baselinker/category-mappings', { method: 'GET' })
      
      return response
    },
  })
}

export const useSaveCategoryMappings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mappings: any[]) => {
      const response = await sdk.client.fetch<{
        success: boolean
        mappings: any[]
        saved_at: string
      }>('/vendor/baselinker/category-mappings', {
        method: 'POST',
        body: { mappings },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...baselinkerKeys.all, 'category-mappings'] 
      })
    },
  })
}

export const useManualPollOrderStatus = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await sdk.client.fetch<{
        success: boolean
        message: string
      }>('/vendor/baselinker/test-poll', {
        method: 'POST',
      })
      return response
    },
  })
}

// Status Mapping Types
export interface StatusMapping {
  id: string
  connection_id: string
  seller_id: string
  bl_status_id: number
  bl_status_name: string | null
  medusa_action: 'none' | 'create_fulfillment' | 'create_shipment' | 'mark_delivered' | 'cancel_order'
  medusa_order_status: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BaseLinkerStatus {
  id: number
  name: string
  name_for_customer: string
  color: string
}

// Status Mapping Hooks
export const useStatusMappings = () => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'status-mappings'],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        mappings: StatusMapping[]
        statuses: BaseLinkerStatus[]
      }>('/vendor/baselinker/status-mappings', {
        method: 'GET',
      })
      return response
    },
  })
}

export const useCreateStatusMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      bl_status_id: number
      bl_status_name?: string
      medusa_action: string
      medusa_order_status?: string
      priority?: number
      is_active?: boolean
    }) => {
      const response = await sdk.client.fetch<{ mapping: StatusMapping }>(
        '/vendor/baselinker/status-mappings',
        {
          method: 'POST',
          body: data,
        }
      )
      return response.mapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'status-mappings'],
      })
    },
  })
}

export const useUpdateStatusMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      bl_status_name?: string
      medusa_action?: string
      medusa_order_status?: string
      priority?: number
      is_active?: boolean
    }) => {
      const response = await sdk.client.fetch<{ mapping: StatusMapping }>(
        `/vendor/baselinker/status-mappings/${id}`,
        {
          method: 'PUT',
          body: data,
        }
      )
      return response.mapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'status-mappings'],
      })
    },
  })
}

export const useDeleteStatusMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/vendor/baselinker/status-mappings/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'status-mappings'],
      })
    },
  })
}

// Carrier Mapping Types
export interface CarrierMapping {
  id: string
  connection_id: string
  seller_id: string
  bl_carrier_code: string
  bl_carrier_name: string | null
  medusa_fulfillment_provider_id: string | null
  medusa_shipping_option_id: string | null
  tracking_url_template: string | null
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface CommonCarrier {
  code: string
  name: string
}

export interface ShippingOption {
  id: string
  name: string
  provider_id: string
  location_name: string
  zone_name: string
}

// Carrier Mapping Hooks
export const useCarrierMappings = () => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'carrier-mappings'],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        mappings: CarrierMapping[]
        carriers: CommonCarrier[]
        shipping_options: ShippingOption[]
      }>('/vendor/baselinker/carrier-mappings', {
        method: 'GET',
      })
      return response
    },
  })
}

export const useCreateCarrierMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      bl_carrier_code: string
      bl_carrier_name?: string
      medusa_fulfillment_provider_id?: string
      medusa_shipping_option_id?: string
      tracking_url_template?: string
      priority?: number
      is_active?: boolean
    }) => {
      const response = await sdk.client.fetch<{ mapping: CarrierMapping }>(
        '/vendor/baselinker/carrier-mappings',
        {
          method: 'POST',
          body: data,
        }
      )
      return response.mapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'carrier-mappings'],
      })
    },
  })
}

export const useUpdateCarrierMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      bl_carrier_code?: string
      bl_carrier_name?: string
      medusa_fulfillment_provider_id?: string
      medusa_shipping_option_id?: string
      tracking_url_template?: string
      priority?: number
      is_active?: boolean
    }) => {
      const response = await sdk.client.fetch<{ mapping: CarrierMapping }>(
        `/vendor/baselinker/carrier-mappings/${id}`,
        {
          method: 'PUT',
          body: data,
        }
      )
      return response.mapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'carrier-mappings'],
      })
    },
  })
}

export const useDeleteCarrierMapping = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/vendor/baselinker/carrier-mappings/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'carrier-mappings'],
      })
    },
  })
}

// Sync Order Status TO BaseLinker
export const useSyncOrderStatusToBaseLinker = () => {
  return useMutation({
    mutationFn: async (data: {
      order_id: string
      bl_status_id: number
    }) => {
      const response = await sdk.client.fetch<{
        success: boolean
        message: string
      }>('/vendor/baselinker/sync/order-status', {
        method: 'POST',
        body: data,
      })
      return response
    },
  })
}

// Variant Template Types
export interface VariantTemplateOption {
  title: string
  values: string[]
}

export interface VariantTemplate {
  id: string
  connection_id: string
  name: string
  description: string | null
  options: VariantTemplateOption[]
  is_active: boolean
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

// Variant Template Hooks
export const useVariantTemplates = () => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'variant-templates'],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        templates: VariantTemplate[]
      }>('/vendor/baselinker/variant-templates', {
        method: 'GET',
      })
      return response.templates
    },
  })
}

export const useVariantTemplate = (id: string) => {
  return useQuery({
    queryKey: [...baselinkerKeys.all, 'variant-templates', id],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        template: VariantTemplate
      }>(`/vendor/baselinker/variant-templates/${id}`, {
        method: 'GET',
      })
      return response.template
    },
    enabled: !!id,
  })
}

export const useCreateVariantTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      options: VariantTemplateOption[]
    }) => {
      const response = await sdk.client.fetch<{
        template: VariantTemplate
      }>('/vendor/baselinker/variant-templates', {
        method: 'POST',
        body: data,
      })
      return response.template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'variant-templates'],
      })
    },
  })
}

export const useUpdateVariantTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      name?: string
      description?: string | null
      options?: VariantTemplateOption[]
      is_active?: boolean
    }) => {
      const response = await sdk.client.fetch<{
        template: VariantTemplate
      }>(`/vendor/baselinker/variant-templates/${id}`, {
        method: 'POST',
        body: data,
      })
      return response.template
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'variant-templates'],
      })
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'variant-templates', variables.id],
      })
    },
  })
}

export const useDeleteVariantTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/vendor/baselinker/variant-templates/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...baselinkerKeys.all, 'variant-templates'],
      })
    },
  })
}
