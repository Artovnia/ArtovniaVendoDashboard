export interface BaselinkerProduct {
  id: string
  name: string
  sku: string
  price: number
  original_price?: number
  original_currency?: string
  conversion_rate?: number
  was_converted?: boolean
  description?: string
  baselinker_category_id?: string | null
  baselinker_category_name?: string | null
  images?: string[]
  quantity?: number
  ean?: string | null
  weight?: number | null
}

export interface BaselinkerCategory {
  id: string
  name: string
  productCount: number
}

export interface CategoryMapping {
  baselinker_category_id: string
  baselinker_category_name: string
  platform_category_id: string | null
}

export interface ProductWithAssignment extends BaselinkerProduct {
  assigned_category_id: string | null
  assigned_shipping_profile_id: string | null
}

export interface ImportPreviewResponse {
  products: BaselinkerProduct[]
  categories: BaselinkerCategory[]
  connection: {
    id: string
    inventory_id: number
  }
}

export interface BulkImportRequest {
  bl_product_ids: string[]
  connection_id?: string
  category_mapping?: Record<string, string>
  default_currency?: string
  default_status?: 'draft' | 'proposed'
  batch_size?: number
}

export interface BulkImportResponse {
  total_products: number
  successful_imports: number
  failed_imports: number
  results: Array<{
    bl_product_id: string
    status: 'success' | 'failed'
    product_id?: string
    error?: string
  }>
}

// Variant grouping types for detecting duplicate products by name
export interface VariantGroupMember {
  product: ProductWithAssignment
  optionValues: Record<string, string> // e.g., { "Size": "L", "Color": "Red" }
}

export interface VariantGroup {
  id: string // Unique group ID
  name: string // Common product name
  members: VariantGroupMember[]
  options: Array<{ title: string; values: string[] }> // e.g., [{ title: "Size", values: ["S", "M", "L"] }]
  isConfigured: boolean // Whether user has assigned option values
  assigned_category_id: string | null
  assigned_shipping_profile_id: string | null
}

export interface GroupedProductAssignment {
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
}
