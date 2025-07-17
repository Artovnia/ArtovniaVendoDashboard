import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuery } from '../../../lib/client';

/**
 * Hook to add a color option to a product
 * This is useful for creating color variants for products
 */
export const useAddColorOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      // Get the product first to check if it already has a color option
      const { product } = await fetchQuery(`/vendor/products/${productId}`, {
        method: 'GET',
      });
      
      // Check if the color option already exists
      const hasColorOption = product.options?.some(
        (option: any) => option.title.toLowerCase() === 'kolor'
      );
      
      if (hasColorOption) {
        return { 
          message: 'Color option already exists for this product',
          product 
        };
      }
      
      // Add the color option by updating the product
      // This uses the existing product update endpoint
      const options = [...(product.options || []), { title: 'Kolor' }];
      
      const response = await fetchQuery(`/vendor/products/${productId}`, {
        method: 'POST',
        body: {
          options,
        },
      });
      
      return {
        message: 'Color option added successfully',
        product: response.product
      };
    },
    onSuccess: (_, productId) => {
      // Invalidate product queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['product', productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['products'],
      });
    },
  });
};
