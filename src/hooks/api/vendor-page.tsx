import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchQuery } from '../../lib/client'

// Types
export interface BlockMotion {
  enter: 'none' | 'fade' | 'fade-up' | 'slide-left' | 'slide-right'
  stagger?: boolean
  delay?: number
}

export interface Block {
  id: string
  type: string
  order: number
  data: any
  motion?: BlockMotion
}

export interface VendorPageSettings {
  animations: 'none' | 'subtle' | 'expressive'
  primary_color?: string
  show_story_tab: boolean
}

export interface VendorPage {
  id: string
  seller_id: string
  template: 'minimal' | 'story' | 'gallery' | 'artisan'
  settings: VendorPageSettings
  blocks: { items: Block[] }
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface TemplateDefinition {
  name: string
  name_pl: string
  description: string
  description_pl: string
  allowedBlocks: string[]
  defaultBlocks: Partial<Block>[]
  defaultMotion: string
}

export interface VendorPageResponse {
  page: VendorPage | null
  templates: Record<string, TemplateDefinition>
}

// Query keys
const vendorPageQueryKey = ['vendor-page']

// Hooks
export const useVendorPage = () => {
  const { data, ...rest } = useQuery({
    queryKey: vendorPageQueryKey,
    queryFn: async () => {
      const response = await fetchQuery('/vendor/page', {
        method: 'GET',
      })
      return response as VendorPageResponse
    },
  })

  return {
    page: data?.page,
    templates: data?.templates,
    ...rest,
  }
}

export const useCreateVendorPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: string) => {
      const response = await fetchQuery('/vendor/page', {
        method: 'POST',
        body: { template },
      })
      return (response as { page: VendorPage }).page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorPageQueryKey })
    },
  })
}

export const useUpdateVendorPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      template?: string
      settings?: Partial<VendorPageSettings>
      blocks?: Block[]
      is_published?: boolean
    }) => {
      const response = await fetchQuery('/vendor/page', {
        method: 'POST', // Using POST since fetchQuery only supports GET/POST/DELETE
        body: { ...data, _method: 'PUT' },
      })
      return (response as { page: VendorPage }).page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorPageQueryKey })
    },
  })
}

export const usePublishVendorPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (is_published: boolean) => {
      const response = await fetchQuery('/vendor/page/publish', {
        method: 'POST',
        body: { is_published },
      })
      return (response as { page: VendorPage }).page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorPageQueryKey })
    },
  })
}

export const useDeleteVendorPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await fetchQuery('/vendor/page', {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorPageQueryKey })
    },
  })
}
