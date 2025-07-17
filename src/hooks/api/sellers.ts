import { QueryKey, UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeysFactory } from "../../lib/query-key-factory";

// Create query keys for sellers with extended type
const baseQueryKeys = queryKeysFactory('sellers');
export const sellersQueryKeys = {
  ...baseQueryKeys,
  products: (id: string, params?: Record<string, any>) => 
    [...baseQueryKeys.detail(id), 'products', ...(params ? [params] : [])],
  messages: (id: string) => [...baseQueryKeys.detail(id), 'messages']
};

// Create query keys for vendors
const vendorBaseQueryKeys = queryKeysFactory('vendors');
export const vendorsQueryKeys = {
  ...vendorBaseQueryKeys,
  products: (id: string, params?: Record<string, any>) => 
    [...vendorBaseQueryKeys.detail(id), 'products', ...(params ? [params] : [])],
  messages: (id: string) => [...vendorBaseQueryKeys.detail(id), 'messages']
};

// Type definitions
export type Seller = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  blocked_at?: string;
  block_reason?: string;
  block_ends_at?: string | null;
};

export type Product = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: string;
  created_at: string;
  updated_at: string;
  collection?: {
    id: string;
    title: string;
  };
};

export type Message = {
  id: string;
  subject: string;
  content: string;
  from_admin: boolean;
  created_at: string;
};

// Fetch all sellers
export const useAdminSellers = (
  params?: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: string;
  },
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { sellers: Seller[]; count: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: sellersQueryKeys.list(params),
    queryFn: async () => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers?${new URLSearchParams({
        limit: params?.limit?.toString() || "20",
        offset: params?.offset?.toString() || "0",
        ...(params?.q ? { q: params.q } : {}),
        ...(params?.status ? { status: params.status } : {})
      }).toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch sellers");
      }
      
      return await response.json();
    },
    ...options
  });

  return {
    sellers: data?.sellers || [],
    count: data?.count || 0,
    ...rest,
  };
};

// Fetch a single seller
export const useAdminSeller = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { seller: Seller },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: sellersQueryKeys.detail(id),
    queryFn: async () => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch seller details");
      }
      
      return await response.json();
    },
    ...options
  });

  return {
    seller: data?.seller,
    ...rest,
  };
};

// Fetch products for a seller
export const useAdminSellerProducts = (
  sellerId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
  },
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { products: Product[]; count: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: sellersQueryKeys.products(sellerId, params),
    queryFn: async () => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers/${sellerId}/products?${new URLSearchParams({
        limit: params?.limit?.toString() || "20",
        offset: params?.offset?.toString() || "0",
        ...(params?.status ? { status: params.status } : {})
      }).toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch seller products");
      }
      
      return await response.json();
    },
    ...options
  });

  return {
    products: data?.products || [],
    count: data?.count || 0,
    ...rest,
  };
};

// Fetch products for a vendor
export const useAdminVendorProducts = (
  vendorId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
  },
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { products: Product[]; count: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: vendorsQueryKeys.products(vendorId, params),
    queryFn: async () => {
      // Create proper URLSearchParams
      const queryParams = new URLSearchParams({
        limit: params?.limit?.toString() || "20",
        offset: params?.offset?.toString() || "0",
        ...(params?.status ? { status: params.status } : {})
      });
      
      // Try using the sellers endpoint first (this should work based on your backend)
      try {
        const response = await fetch(`/admin/sellers/${vendorId}/products?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch vendor products");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching vendor products:", error);
        
        // Fallback to the old approach if the new one fails
        const fallbackResponse = await fetch(`/admin/products?seller_id=${vendorId}&${queryParams.toString()}`);
        
        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch vendor products");
        }
        
        return await fallbackResponse.json();
      }
    },
    ...options
  });

  return {
    products: data?.products || [],
    count: data?.count || 0,
    ...rest,
  };
};


// Block a seller
export const useAdminBlockSeller = (sellerId: string) => {
  return useMutation({
    mutationFn: async ({ reason, duration }: { reason: string; duration?: string }) => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers/${sellerId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
          duration,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to block seller");
      }
      
      return await response.json();
    },
  });
};

// Unblock a seller
export const useAdminUnblockSeller = (sellerId: string) => {
  return useMutation({
    mutationFn: async () => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers/${sellerId}/unblock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to unblock seller");
      }
      
      return await response.json();
    },
  });
};

// Fetch messages for a seller
export const useAdminVendorMessages = (
  sellerId: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { messages: Message[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: sellersQueryKeys.messages(sellerId),
    queryFn: async () => {
      // Using the Medusa.js API structure (without /api prefix)
      const response = await fetch(`/admin/sellers/${sellerId}/messages`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch seller messages");
      }
      
      return await response.json();
    },
    ...options
  });

  return {
    messages: data?.messages || [],
    ...rest,
  };
};

// Send a message to a seller
export const useAdminSendVendorMessage = (sellerId: string) => {
  return useMutation({
    mutationFn: async ({ subject, content }: { subject: string; content: string }) => {
      try {
        // Using the Medusa.js API structure (without /api prefix)
        const response = await fetch(`/admin/sellers/${sellerId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            content,
          }),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error("Error sending message to seller:", responseData);
          throw new Error(responseData.message || "Failed to send message to seller");
        }
        
        return responseData;
      } catch (error) {
        console.error("Error sending message to seller:", error);
        throw error;
      }
    },
  });
};
