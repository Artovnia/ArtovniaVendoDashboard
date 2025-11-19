import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQuery } from '../../lib/client'

// Type definitions for the color API responses
export type Color = {
  id: string
  name: string
  display_name: string
  hex_code: string
  family_id?: string
  sort_order?: number
  is_active?: boolean
}

export type ColorFamily = {
  id: string
  name: string
  display_name: string
  hex_base: string | null
  sort_order?: number
  is_active?: boolean
  colors: Color[]
}

export type ColorTaxonomyResponse = {
  color_families: ColorFamily[]
}

export type ProductColorsResponse = {
  product_id: string
  colors: Color[]
  count: number
}

/**
 * Hook to fetch all color families including their colors
 */
export const useColorTaxonomy = () => {
  return useQuery({
    queryKey: ['color-taxonomy'],
    queryFn: async () => {
      const response = await fetchQuery('/vendor/colors/taxonomy', {
        method: 'GET',
      })
      
      return response as ColorTaxonomyResponse
    },
  })
}

/**
 * Hook to find all colors in a specific family by using the taxonomy
 */
export const useColorsByFamily = (familyId: string) => {
  const taxonomyQuery = useColorTaxonomy()
  
  return useQuery({
    queryKey: ['colors-by-family', familyId],
    queryFn: async () => {
      if (!familyId) return []
      
      // Get from the taxonomy data instead of a separate endpoint
      const taxonomy = taxonomyQuery.data
      if (!taxonomy) return []
      
      const family = taxonomy.color_families.find(f => f.id === familyId)
      return family?.colors || []
    },
    enabled: !!familyId && taxonomyQuery.isSuccess,
  })
}

/**
 * Hook to get colors for a product
 */
export const useProductColors = (productId: string) => {
  return useQuery({
    queryKey: ['product-colors', productId],
    queryFn: async () => {
      if (!productId) return { product_id: '', colors: [], count: 0 }
      
      const response = await fetchQuery(`/vendor/products/${productId}/colors`, {
        method: 'GET',
      })
      
      return response as ProductColorsResponse
    },
    enabled: !!productId,
  })
}

/**
 * Hook to get colors for a specific product variant
 */
export const useVariantColors = (productId: string, variantId: string) => {
  return useQuery({
    queryKey: ['variant-colors', productId, variantId],
    queryFn: async () => {
      if (!productId || !variantId) return { variant_id: variantId, colors: [], count: 0 }
      
      const response = await fetchQuery(
        `/vendor/products/${productId}/variants/${variantId}/colors`, 
        { method: 'GET' }
      )
      
      return response
    },
    enabled: !!productId && !!variantId,
  })
}

/**
 * Hook to assign colors to a product variant
 */
// Type for color assignment with metadata
export type ColorAssignment = {
  color_id: string;
  is_primary?: boolean;
  color_coverage?: 'primary' | 'secondary' | 'accent' | 'trim';
  color_percentage?: number | null;
};

export const useAssignVariantColors = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      productId,
      variantId, 
      colorIds 
    }: { 
      productId: string,
      variantId: string,
      colorIds: string[] | ColorAssignment[] 
    }) => {
      
      // Always make a clean POST with properly formatted colors
      let formattedColors: ColorAssignment[] = [];
      
      // Handle empty array case - this will clear all colors
      if (colorIds.length === 0) {
        formattedColors = [];
      }
      // Handle string array case
      else if (typeof colorIds[0] === 'string') {
        formattedColors = (colorIds as string[]).map((id, index) => ({
          color_id: id,
          is_primary: index === 0, // First color is primary
          color_coverage: 'primary'
        }));
      }
      // Handle pre-formatted ColorAssignment objects
      else {
        formattedColors = colorIds as ColorAssignment[];
      }
      
      const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}/colors`, {
        method: 'POST',
        body: {
          colors: formattedColors
        },
      })
      
      return response
    },
    onSuccess: (_, { productId, variantId }) => {
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['variant-colors', productId, variantId],
      })
      // Also invalidate product colors since variant colors affect product colors
      queryClient.invalidateQueries({
        queryKey: ['product-colors', productId],
      })
      
      // Add a small delay and then invalidate again to ensure we get the updated product colors
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['product-colors', productId],
        })
      }, 1000)
    },
  })
}

/**
 * Hook to search colors by name or synonyms
 * Uses client-side filtering of taxonomy data instead of API call
 */
export const useSearchColors = (searchTerm: string) => {
  const { data: taxonomy } = useColorTaxonomy();

  return useQuery({
    queryKey: ['search-colors', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return []
      if (!taxonomy) return []
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchingColors: Color[] = [];
      
      // Search through all color families and their colors
      taxonomy.color_families.forEach(family => {
        family.colors.forEach(color => {
          // Check if the color name, display name, or hex code contains the search term
          if (
            color.name.toLowerCase().includes(searchTermLower) ||
            color.display_name.toLowerCase().includes(searchTermLower) ||
            color.hex_code.toLowerCase().includes(searchTermLower)
          ) {
            matchingColors.push(color);
          }
        });
      });
      
      return matchingColors;
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
  })
}

/**
 * A hook that provides a search function instead of a query
 * Uses client-side filtering of taxonomy data instead of API call
 */
export const useColorSearch = () => {
  const { data: taxonomy } = useColorTaxonomy();
  
  // For flexibility, provide a callback function instead of a query
  const searchColors = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return []
    if (!taxonomy) return []
    
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const matchingColors: Color[] = [];
      
      // Search through all color families and their colors
      taxonomy.color_families.forEach(family => {
        family.colors.forEach(color => {
          // Check if the color name, display name or hex code contains the search term
          if (
            color.name.toLowerCase().includes(searchTermLower) ||
            color.display_name.toLowerCase().includes(searchTermLower) ||
            color.hex_code.toLowerCase().includes(searchTermLower)
          ) {
            matchingColors.push(color);
          }
        });
      });
      
      return matchingColors;
    } catch (error) {
      console.error('Error searching colors:', error)
      return []
    }
  }

  return { searchColors }
}

/**
 * Hook to assign colors to a product
 */
export const useAssignProductColors = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      productId, 
      colorIds 
    }: { 
      productId: string
      colorIds: string[] 
    }) => {
      const response = await fetchQuery(`/vendor/products/${productId}/colors`, {
        method: 'POST',
        body: {
          color_ids: colorIds,
        },
      })
      
      return response as ProductColorsResponse
    },
    onSuccess: (_, { productId }) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['product-colors', productId],
      })
    },
  })
}
