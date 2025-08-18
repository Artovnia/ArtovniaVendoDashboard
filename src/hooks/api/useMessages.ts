import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Import client utilities for authentication handling
import { fetchQuery } from '../../lib/client/index';

// Helper function to fetch customer details by ID
async function fetchCustomerDetails(customerId: string) {
  if (!customerId) return null;
  try {
    const response = await fetchQuery(`/vendor/customers/${customerId}`, { method: 'GET' });
    return response.customer || null;
  } catch (err) {
    console.error(`Error fetching customer details for ID ${customerId}:`, err);
    return null;
  }
}

// Hook to fetch multiple customer details at once
export const useCustomersDetails = (customerIds: string[]) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['customers', ...customerIds],
    queryFn: async () => {
      if (!customerIds.length) return {};
      
      // Create a map to store results
      const customerMap: Record<string, any> = {};
      
      // Process customer IDs in small batches to avoid overwhelming API
      const batchSize = 5;
      for (let i = 0; i < customerIds.length; i += batchSize) {
        const batch = customerIds.slice(i, i + batchSize);
        
        // Process batch in parallel
        const promises = batch.map(async (id) => {
          try {
            // Check if we already have this customer in cache
            const cached = queryClient.getQueryData(['customer', id]);
            if (cached) {
              return { id, data: cached };
            }
            
            // Fetch customer data
            const data = await fetchCustomerDetails(id);
            
            // Cache individual customer data
            queryClient.setQueryData(['customer', id], data);
            
            return { id, data };
          } catch (err) {
            console.error(`Error fetching customer ${id}:`, err);
            return { id, data: null, error: err };
          }
        });
        
        // Wait for all promises in this batch
        const results = await Promise.all(promises);
        
        // Add results to the map
        results.forEach(result => {
          if (result.data) {
            customerMap[result.id] = result.data;
          }
        });
      }
      
      return customerMap;
    },
    enabled: customerIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache customer data for 5 minutes
  });
}

// Types for the message API
export type MessageSender = 'admin' | 'seller' | 'user';

export type ThreadMessage = {
  id: string;
  thread_id: string;
  content: string;
  sender_type: MessageSender;
  attachment_url?: string | null;
  attachment_thumbnail_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageThread = {
  id: string;
  subject: string;
  type: 'general' | 'support' | 'complaint';
  user_id: string | null;
  admin_id: string | null;
  last_message_at: string | null;
  seller_read_at: string | null;
  created_at: string;
  updated_at: string;
  messages: ThreadMessage[];
  metadata?: {
    customer_id?: string;
    customer_email?: string;
  } | null;
};

// Hook to fetch message threads for the vendor
export const useVendorThreads = (type: 'admin' | 'user' = 'admin', page = 1, limit = 5) => {
  return useQuery({
    // Use stable query key, otherwise we get infinite refetching
    queryKey: ['vendor', 'messages', type, page, limit],
    queryFn: async () => {
      // Add pagination parameters
      const skip = (page - 1) * limit;
      
      try {
        
        // Use the appropriate endpoint based on the message type
        const endpoint = type === 'user' 
          ? `/vendor/messages/user` // User/customer messages endpoint
          : `/vendor/messages`;    // Admin messages endpoint

        
        // Make the API request
        const data = await fetchQuery(endpoint, {
          method: 'GET',
          query: {
            skip: skip.toString(),
            take: limit.toString()
          }
        });
        
        if (!data || !data.threads || !Array.isArray(data.threads)) {
          console.warn(`API returned invalid format from ${endpoint}:`, data);
          return { threads: [], count: 0 };
        }
        
        const threads = data.threads as MessageThread[];
        
        // Additional filtering in the frontend to ensure we only have the right message type
        // This is a safety measure in case the API doesn't filter correctly
        const filteredThreads = type === 'admin'
          ? threads.filter(thread => {
              // Admin threads should not have customer identifiers
              return !thread.user_id && 
                     !thread.metadata?.customer_id && 
                     !thread.metadata?.customer_email;
            })
          : threads.filter(thread => {
              // Customer threads have user_id OR customer info in metadata
              return thread.user_id || 
                     thread.metadata?.customer_id || 
                     thread.metadata?.customer_email;
            })
          
        
        
        // Process threads to ensure customer information is accessible
        const processedThreads = filteredThreads.map(thread => ({
          ...thread,
          customer_id: thread.metadata?.customer_id || thread.user_id,
          customer_email: thread.metadata?.customer_email || ''
        }));
        
        
        
        return { 
          threads: processedThreads,
          count: data.count || processedThreads.length 
        };
      } catch (error) {
        console.error(`Error fetching ${type} threads:`, error);
        return { threads: [], count: 0 };
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
};

// Hook to fetch a specific message thread
export const useVendorThread = (threadId: string) => {
  return useQuery({
    queryKey: ['vendor', 'messages', 'thread', threadId],
    queryFn: async () => {
      try {
        
        
        // Use fetchQuery which handles auth token automatically
        const data = await fetchQuery(`/vendor/messages/${threadId}`, {
          method: 'GET'
        });
        
        
        
        return data.thread as MessageThread;
      } catch (error) {
        console.error(`Error fetching thread ${threadId}:`, error);
        throw error;
      }
    },
    enabled: !!threadId,
    retry: 1
  });
};

// Hook to send a new message or reply to an existing thread
export const useSendVendorMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      subject, 
      content, 
      thread_id,
      recipient_type = 'admin', // 'admin' or 'user'
      initial_message,
      attachment_url,
      attachment_thumbnail_url,
      attachment_name,
      attachment_type
    }: { 
      subject?: string; 
      content: string;
      thread_id?: string | null;
      recipient_type?: 'admin' | 'user';
      initial_message?: {
        content: string;
        attachment_url?: string;
        attachment_thumbnail_url?: string;
        attachment_name?: string;
        attachment_type?: string;
      };
      // Direct attachment properties for replies
      attachment_url?: string;
      attachment_thumbnail_url?: string;
      attachment_name?: string;
      attachment_type?: string;
    }) => {
      try {
        // If we're replying to an existing thread
        if (thread_id) {
          
          const payload = {
            content,
            sender_type: 'seller', // Message is from seller
            attachment_url,
            attachment_thumbnail_url,
            attachment_name,
            attachment_type
          };
          
    
          
          // Use fetchQuery which handles auth token automatically
          // Make sure to use the correct endpoint with /reply suffix
          const data = await fetchQuery(`/vendor/messages/${thread_id}/reply`, {
            method: 'POST',
            body: payload
          });
          
          
          return data;
        } else {
          // Creating a new thread requires a subject
          if (!subject) {
            throw new Error('Subject is required when creating a new thread');
          }
          
          const payload = {
            subject,
            type: 'general',
            recipient_type, // Who we're sending to
            initial_message: {
              content,
              sender_type: 'seller',
              attachment_url: initial_message?.attachment_url || attachment_url,
              attachment_thumbnail_url: initial_message?.attachment_thumbnail_url || attachment_thumbnail_url,
              attachment_name: initial_message?.attachment_name || attachment_name,
              attachment_type: initial_message?.attachment_type || attachment_type
            }
          };
          
          
          
          // Use fetchQuery which handles auth token automatically
          const data = await fetchQuery('/vendor/messages', {
            method: 'POST',
            body: payload
          });
          
          
          return data;
        }
      } catch (error) {
        console.error(`Error sending message:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['vendor', 'messages'] });
    }
  });
};

// Hook to mark a thread as read
export const useMarkThreadAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      try {
        
        
        const data = await fetchQuery(`/vendor/messages/${threadId}/read`, {
          method: 'POST'
        });
        
        
        return data;
      } catch (error) {
        console.error(`Error marking thread as read:`, error);
        throw error;
      }
    },
    onSuccess: (_, threadId) => {
      // Invalidate the specific thread query and the threads list
      queryClient.invalidateQueries({ queryKey: ['vendor', 'messages', 'thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'messages'] });
    }
  });
};
