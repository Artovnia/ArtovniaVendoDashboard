import { useQuery } from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client/index';
import { MessageThread } from './useMessages';

/**
 * Helper function to check if a thread has unread messages
 * @param thread The message thread to check
 * @returns boolean indicating if the thread has unread messages
 */
export function hasUnreadMessages(thread: MessageThread): boolean {
  // If there's no seller_read_at timestamp, all messages are unread
  if (!thread.seller_read_at) return true;
  
  // If there's a last_message_at timestamp and it's newer than seller_read_at,
  // then there are unread messages
  if (thread.last_message_at && 
      new Date(thread.last_message_at).getTime() > new Date(thread.seller_read_at).getTime()) {
    return true;
  }
  
  // If we have messages array, check each message's timestamp against seller_read_at
  if (thread.messages && thread.messages.length > 0) {
    // Only count messages from admin or user as potentially unread
    return thread.messages.some(message => 
      (message.sender_type === 'admin' || message.sender_type === 'user') &&
      new Date(message.created_at).getTime() > new Date(thread.seller_read_at as string).getTime()
    );
  }
  
  return false;
}

/**
 * Hook to fetch unread message count for the vendor
 * @returns Object with unread count and loading state
 */
export const useUnreadMessages = () => {
  return useQuery({
    queryKey: ['vendor', 'messages', 'unread'],
    queryFn: async () => {
      try {
        // First approach: Try to fetch threads and calculate unread count
        const adminResponse = await fetchQuery('/vendor/messages', { 
          method: 'GET',
          query: { limit: 100 } // Get a reasonable number of threads
        });
        
        const userResponse = await fetchQuery('/vendor/messages/user', { 
          method: 'GET',
          query: { limit: 100 } // Get a reasonable number of threads 
        });
        
        const adminThreads = adminResponse?.threads || [];
        const userThreads = userResponse?.threads || [];
        
        // Combine all threads
        const allThreads = [...adminThreads, ...userThreads];
        
        // Calculate unread count
        const unreadCount = allThreads.filter(thread => hasUnreadMessages(thread)).length;
        
        return { unreadCount };
      } catch (error) {
        console.error('Error fetching unread message count:', error);
        return { unreadCount: 0 };
      }
    },
    // Keep it fresh but don't refetch too often
    refetchInterval: 1000 * 60, // Every minute
    staleTime: 1000 * 30, // Consider stale after 30 seconds
  });
};
