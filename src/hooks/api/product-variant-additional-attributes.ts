import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client/client"

// Define reusable interfaces
export interface AttributeValue {
  attribute_id: string;
  value: string;
  id?: string;
  attribute_name?: string;
  attribute?: {
    id: string;
    name: string;
    handle: string;
    ui_component?: string;
  };
}

export interface Attribute {
  id: string;
  name: string;
  handle: string;
  ui_component?: string;
  possible_values: string[];
}

export interface VariantAttributesData {
  attributes: Attribute[];
  attribute_values: AttributeValue[];
}

/**
 * Hook for fetching product variant attributes
 */
export const useProductVariantAttributes = (productId: string, variantId: string) => {
  console.log(`[DEBUG] useProductVariantAttributes called with productId: ${productId}, variantId: ${variantId}`);

  // Fetch variant attribute values
  const { data: variantData, isLoading: isVariantLoading, error: variantError } = useQuery({
    queryFn: async () => {
      console.log(`[DEBUG] Fetching variant attribute values for variant: ${variantId}`);
      
      try {
        const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}/attributes`, {
          method: 'GET'
        })
        console.log('[DEBUG] Variant attributes response:', response)
        
        return {
          attribute_values: Array.isArray(response?.attribute_values) ? response.attribute_values : []
        }
      } catch (err) {
        console.error("[DEBUG] Variant attributes fetch error:", err)
        throw err
      }
    },
    queryKey: ["variant-attributes", productId, variantId],
    enabled: !!productId && !!variantId,
    retry: 2,
  })
  
  // Fetch available attributes
  const { data: attributesData, isLoading: isAttributesLoading, error: attributesError } = useQuery({
    queryFn: async () => {
      console.log(`[DEBUG] Fetching available attributes`)
      try {
        const attributesResponse = await fetchQuery('/vendor/attributes', {
          method: "GET",
          query: {
            fields: "id,name,handle,ui_component,*possible_values,possible_values.value,possible_values.rank",
            limit: 100
          }
        })
        
        if (attributesResponse && Array.isArray(attributesResponse.attributes)) {
          const processedAttributes = attributesResponse.attributes.map((attr: any) => {
            let possible_values = attr.possible_values || [];
            
            if (Array.isArray(possible_values) && possible_values.length > 0 && typeof possible_values[0] === 'object') {
              possible_values = possible_values
                .filter(val => val && typeof val === 'object' && 'value' in val)
                .map(val => val.value as string);
            } else if (typeof possible_values === 'string') {
              possible_values = possible_values.split(',').map(val => val.trim());
            }
            
            return {
              ...attr,
              possible_values
            };
          });
          
          return processedAttributes;
        }
        return [];
      } catch (attrError) {
        console.error("[DEBUG] Error fetching available attributes:", attrError);
        return [];
      }
    },
    queryKey: ["product-attributes"],
    retry: 1,
  })
  
  const isLoading = isVariantLoading || isAttributesLoading;
  const error = variantError || attributesError;
  
  const combinedData: VariantAttributesData = {
    attributes: attributesData || [],
    attribute_values: variantData?.attribute_values || []
  };

  return { 
    data: combinedData,
    isLoading, 
    error 
  };
}

/**
 * Hook for updating product variant attribute values
 */
export const useUpdateProductVariantAttributes = (
  productId: string,
  variantId: string,
  options?: { onSuccess?: (data: any, variables: any, context: any) => void }
) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { attribute_values: Array<{ attribute_id: string, value: string }> }) => {
      console.log(`[DEBUG] Updating variant attributes for product ${productId}, variant ${variantId}`, data)
      
      if (!productId || !variantId) {
        throw new Error('Cannot update attributes: Product ID or Variant ID is undefined')
      }

      // Process input values - filter invalid entries and ensure uniqueness per attribute
      const uniqueAttributeValues = new Map<string, string>()
      
      data.attribute_values
        .filter(av => av && av.attribute_id && av.value !== undefined && av.value !== '')
        .forEach(av => {
          // Only keep the last value for each attribute_id (in case of duplicates)
          uniqueAttributeValues.set(av.attribute_id, av.value)
        })
      
      const attributeValuesToUpdate = Array.from(uniqueAttributeValues.entries())
        .map(([attribute_id, value]) => ({
          attribute_id,
          value
        }))
      
      console.log('[DEBUG] Final unique attribute values to update:', attributeValuesToUpdate)
      
      if (attributeValuesToUpdate.length === 0) {
        // Send empty array to remove all attributes
        const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}/attributes`, {
          method: 'POST',
          body: {
            values: []
          }
        })
        return response
      }
      
      // Send update to backend
      const response = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}/attributes`, {
        method: 'POST',
        body: {
          values: attributeValuesToUpdate
        }
      })
      
      return response
    },
    onSuccess: (data, variables, context) => {
      console.log(`[DEBUG] Successfully updated variant attributes`)
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["variant-attributes", productId, variantId],
      })
      
      queryClient.invalidateQueries({
        queryKey: ['variant', productId, variantId]
      })
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error) => {
      console.error(`[DEBUG] Mutation error:`, error)
    }
  })
}