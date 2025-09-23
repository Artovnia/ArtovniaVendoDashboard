import { Container, Tabs, Text, Button, Heading, Textarea, Input, Label, Badge } from "@medusajs/ui";
import { useState, useEffect, useMemo } from "react";
import { PlusMini, ArrowDownLeft, PaperClip, ChevronDown, ChevronUpMini } from "@medusajs/icons";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useVendorThreads, useSendVendorMessage, useMarkThreadAsRead, useCustomersDetails, MessageThread as BaseMessageThread } from "../../hooks/api/useMessages";
import { uploadFilesQuery } from "../../lib/client";
import { toast } from "@medusajs/ui";

// Enhanced MessageThread type that includes properties added by the hook
type MessageThread = BaseMessageThread & {
  customer_id?: string | null;
  customer_email?: string | null;
};

export function MessagesPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentType, setAttachmentType] = useState<string>("");
  const [attachmentThumbnailUrl, setAttachmentThumbnailUrl] = useState<string>("");
  // Track which threads are collapsed (true = collapsed, false = expanded)
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});
  const threadsPerPage = 5;
  
  // Fetch threads based on active tab and current page
  const { 
    data, 
    isLoading: isLoadingThreads, 
    refetch 
  } = useVendorThreads(activeTab, currentPage, threadsPerPage);
  
  // Extract threads and count from the response
  const unsortedThreads = data?.threads || [];
  const totalCount = data?.count || 0;
  
  // Sort threads to put unread messages at the top, then by most recent activity
  const threads = useMemo(() => {
    return [...unsortedThreads].sort((a, b) => {
      // First, sort by unread status (unread comes first)
      const aHasUnread = !a.seller_read_at || 
        (a.last_message_at && new Date(a.seller_read_at) < new Date(a.last_message_at));
      const bHasUnread = !b.seller_read_at || 
        (b.last_message_at && new Date(b.seller_read_at) < new Date(b.last_message_at));
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // If both are unread or both are read, sort by most recent activity
      const aLastActivity = a.last_message_at || a.updated_at || a.created_at;
      const bLastActivity = b.last_message_at || b.updated_at || b.created_at;
      
      // Sort by most recent activity (descending order)
      return new Date(bLastActivity).getTime() - new Date(aLastActivity).getTime();
    });
  }, [unsortedThreads]);
  
  const { mutateAsync: sendMessage, isPending: isSending } = useSendVendorMessage();
  const { mutateAsync: markAsRead } = useMarkThreadAsRead();
  
  // Initialize all threads as collapsed only when they first load
  useEffect(() => {
    if (threads.length > 0) {
      // Create an object with all threads set to collapsed (true)
      // but preserve any existing state for threads the user has already interacted with
      const initialCollapsedState = threads.reduce((acc, thread) => {
        // Only set to collapsed if we don't already have a state for this thread
        if (collapsedThreads[thread.id] === undefined) {
          acc[thread.id] = true; // true means collapsed
        }
        return acc;
      }, {} as Record<string, boolean>);
      
      // Only update state if we have new threads to initialize
      if (Object.keys(initialCollapsedState).length > 0) {
        setCollapsedThreads(prev => ({
          ...prev,
          ...initialCollapsedState
        }));
      }
    }
  }, [threads]);
  
  
  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThreadId) {
      markAsRead(selectedThreadId);
    }
  }, [selectedThreadId, markAsRead]);
  
  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Set initial values while upload is in progress
      setAttachment(file);
      setAttachmentName(file.name);
      setAttachmentType(file.type);
      
      try {
        // Set a temporary loading preview
        const loadingPreview = URL.createObjectURL(file);
        setAttachmentUrl(loadingPreview);
        if (file.type.startsWith('image/')) {
          setAttachmentThumbnailUrl(loadingPreview);
        }
      
        
        // Format file for upload as expected by uploadFilesQuery
        const uploadResult = await uploadFilesQuery([{ file }]);
        
        if (!uploadResult || !uploadResult.files || uploadResult.files.length === 0) {
          throw new Error('Upload failed: No files returned from server');
        }
        
        
        
        // Clean up the temporary preview URL
        URL.revokeObjectURL(loadingPreview);
        
        // Extract the uploaded file info from the response
        const uploadedFile = uploadResult.files[0];
        
        // Store the permanent URLs from S3
        setAttachmentUrl(uploadedFile.url);
        setAttachmentThumbnailUrl(uploadedFile.url); // Use same URL for thumbnail or specify if different
        setAttachmentName(uploadedFile.originalname || file.name);
        
        toast.success('File uploaded successfully');
        
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error('Failed to upload file. Please try again.');
        
        // Clear attachment state on error
        clearAttachment();
      
        // Clear the attachment data on failure
        clearAttachment();
      }
    }
  };
  
  const clearAttachment = () => {
    if (attachmentUrl) {
      URL.revokeObjectURL(attachmentUrl);
    }
    setAttachment(null);
    setAttachmentUrl("");
    setAttachmentName("");
    setAttachmentType("");
    setAttachmentThumbnailUrl("");
  };
  
  const handleSendMessage = async () => {
    // Validate inputs depending on whether we're creating a new thread or replying
    if ((!subject && !selectedThreadId) || !message) {
      console.error("Missing required fields");
      return;
    }
    
    try {
      const payload: any = {
        content: message,
        recipient_type: activeTab, // 'admin' or 'user'
      };
      
      // Only add thread_id if replying to an existing thread
      if (selectedThreadId) {
        payload.thread_id = selectedThreadId;
      } else {
        // For new threads, subject is required
        payload.subject = subject;
      }
      
      // Add attachment info if present
      if (attachmentUrl) {
        
        
        // Add attachment properties directly to the payload
        // The useSendVendorMessage hook will handle them correctly for both new threads and replies
        payload.attachment_url = attachmentUrl;
        payload.attachment_thumbnail_url = attachmentThumbnailUrl;
        payload.attachment_name = attachmentName;
        payload.attachment_type = attachmentType;
      }
      
      await sendMessage(payload);
      
      // Reset form state
      setSubject("");
      setMessage("");
      clearAttachment();
      refetch();
      
      // Reset UI state after sending
      if (selectedThreadId) {
        setSelectedThreadId(null);
        setShowNewMessageForm(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  const handleReplyToThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowNewMessageForm(false);
  };
  
  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'pl' ? pl : enUS;
    const formatPattern = i18n.language === 'pl' ? "d MMM yyyy, HH:mm" : "MMM d, yyyy h:mm a";
    return format(new Date(dateString), formatPattern, { locale });
  };
  
  // Extract unique customer IDs from threads that don't have emails
  const customerIdsToFetch = useMemo(() => {
    if (!data?.threads) return [];
    
    return data.threads
      .filter(thread => {
        // Only include threads without customer email but with customer ID
        const hasEmail = thread.metadata?.customer_email || thread.customer_email;
        const hasId = thread.metadata?.customer_id || thread.user_id;
        return !hasEmail && hasId;
      })
      .map(thread => thread.metadata?.customer_id || thread.user_id)
      .filter(Boolean) as string[];
  }, [data?.threads]);
  
  // Batch fetch all customer details we need
  const { data: customersData } = useCustomersDetails(customerIdsToFetch);
  
  // Create a map of customer IDs to their email addresses
  const customerEmailMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    if (customersData) {
      Object.entries(customersData).forEach(([customerId, customerData]) => {
        if (customerData?.email) {
          map[customerId] = customerData.email;
        }
      });
    }
    
    return map;
  }, [customersData]);
  
  // Helper function to get sender name based on type
  const getSenderName = (senderType: string, thread?: MessageThread): string => {
    if (senderType === 'seller') {
      return 'You';
    } else if (senderType === 'admin') {
      return 'Admin';
    } else if (senderType === 'user') {
      // Try to find customer email from various sources
      const customerId = thread?.metadata?.customer_id || thread?.user_id;
      const customerEmail = thread?.metadata?.customer_email || thread?.customer_email || (customerId ? customerEmailMap[customerId] : null);
      
      // Use email if available, otherwise show ID
      if (customerEmail) {
        return customerEmail;
      } else if (customerId) {
        return `Customer (${customerId.substring(0, 8)}...)`;
      }
      return 'Customer';
    }
    return 'Unknown';
  };
  
  // Calculate pagination values using totalCount from the API
  const totalPages = useMemo(() => {
    // Use the count returned from API, or fall back to array length if needed
    const count = totalCount || threads.length;
    return Math.max(1, Math.ceil(count / threadsPerPage));
  }, [totalCount, threads, threadsPerPage]);
  
  // Get current page threads - sort by newest first
  const currentThreads = useMemo(() => {
    if (threads.length === 0) return [];
    
    // Sort threads by creation date, newest first
    return [...threads].sort((a, b) => {
      // First try to sort by last_message_at if available
      if (a.last_message_at && b.last_message_at) {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
      // Fall back to created_at
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // No need to slice here as the API already handles pagination with skip/take params
  }, [threads]);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Refetch with new page number
    refetch();
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'admin' | 'user') => {
    // Only proceed if we're actually changing tabs
    if (tab !== activeTab) {
      // Reset all pagination and selection state
      setCurrentPage(1);
      setSelectedThreadId(null);
      setShowNewMessageForm(true);
      setCollapsedThreads({});
      
      // Set active tab last (important for preventing race conditions)
      setActiveTab(tab);
      
      // Give React time to update state before triggering refetch
      setTimeout(() => {
        refetch();
      }, 100);
    }
  };
  
  // Toggle thread collapse state and mark as read when expanded
  const toggleThreadCollapse = (threadId: string) => {
    // If we're expanding the thread (currently collapsed), mark it as read
    if (collapsedThreads[threadId] || collapsedThreads[threadId] === undefined) {
      markAsRead(threadId);
    }
    
    setCollapsedThreads(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };
  
  // Function to check if thread has unread messages
  const hasUnreadMessages = (thread: MessageThread) => {
    if (!thread.seller_read_at) return true;
    
    // Check if there are messages newer than the last read time
    const lastReadTime = new Date(thread.seller_read_at).getTime();
    return thread.messages.some(message => 
      message.sender_type !== 'seller' && 
      new Date(message.created_at).getTime() > lastReadTime
    );
  };
  
  return (
    <Container className="p-6 rounded-lg shadow-md max-w-4xl mx-auto border border-ui-border-base">
      <Heading className="text-xl font-bold mb-4">{t('messages.title', 'Messages')}</Heading>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => handleTabChange(value as 'admin' | 'user')}
        className="mb-6"
      >
        <Tabs.List className="border-b border-ui-border-base w-full">
          <Tabs.Trigger value="admin" className="pb-2">{t('messages.admin', 'Admin')}</Tabs.Trigger>
          <Tabs.Trigger value="user" className="pb-2 ml-4">{t('messages.user', 'Clients')}</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
      
      <div className="mb-6">
        <Text className="text-gray-600 mb-4">
          {activeTab === 'admin' 
            ? t('messages.adminDescription')
            : t('messages.userDescription')
          }
        </Text>
        
        {showNewMessageForm ? (
          <div className="space-y-4 mb-8 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Heading className="text-lg">{t('messages.newMessage', 'New message')}</Heading>
            </div>
            
            <div>
              <Text className="font-semibold mb-1">{t('messages.subject', 'Subject')}</Text>
              <Input
                placeholder={t('messages.subjectPlaceholder', 'Enter message subject')}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Text className="font-semibold mb-1">{t('messages.message', 'Message')}</Text>
              <Textarea
                placeholder={t('messages.messagePlaceholder', 'Type your message...')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full"
                rows={4}
              />
            </div>
            
            <div>
              <Label className="font-semibold mb-2 block">{t('messages.attachmentOptional', 'Attachment (optional)')}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={handleAttachmentChange}
                  className="w-full"
                  id="file-upload"
                />
              </div>
              
              {attachment && (
                <div className="mt-2 p-2 rounded border border-gray-300 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PaperClip className="w-4 h-4 text-gray-500" />
                    <Text className="text-sm">{attachmentName}</Text>
                  </div>
                  <Button size="small" variant="secondary" onClick={clearAttachment}>Usuń</Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={isSending || !subject || !message}
                className="flex items-center gap-2"
              >
                <PlusMini className="w-4 h-4" />
                {isSending ? t('messages.sending', 'Sending...') : t('messages.send', 'Send')}
              </Button>
            </div>
          </div>
        ) : selectedThreadId ? (
          <div className="space-y-4 mb-8 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Heading className="text-lg">{t('messages.replyToThread', 'Reply to thread')}</Heading>
              <Button variant="secondary" onClick={() => {
                setSelectedThreadId(null);
                setShowNewMessageForm(true);
              }}>{t('messages.newMessage', 'New message')}</Button>
            </div>
            
            <div>
              <Badge>
                {threads?.find(t => t.id === selectedThreadId)?.subject || t('messages.noSubject', 'No Subject')}
              </Badge>
            </div>
            
            <div>
              <Text className="font-semibold mb-1">{t('messages.reply', 'Reply')}</Text>
              <Textarea
                placeholder={t('messages.replyPlaceholder', 'Type your reply here...')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full"
                rows={4}
              />
            </div>
            
            <div>
              <Label className="font-semibold mb-2 block">{t('messages.attachmentOptional', 'Attachment (optional)')}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={handleAttachmentChange}
                  className="w-full"
                  id="file-upload"
                />
              </div>
              
              {attachment && (
                <div className="mt-2 p-2 rounded border border-gray-300 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PaperClip className="w-4 h-4 text-gray-500" />
                    <Text className="text-sm">{attachmentName}</Text>
                  </div>
                  <Button size="small" variant="secondary" onClick={clearAttachment}>Usuń</Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={isSending || !message}
                className="flex items-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                {isSending ? t('messages.sending', 'Sending...') : t('messages.sendReply', 'Send Reply')}
              </Button>
            </div>
          </div>
        ) : null}
        
        {/* Message Threads */}
        <div className="mt-8">
          <Heading className="text-lg font-semibold mb-4">{t('messages.threads', 'Threads')}</Heading>
          
          {isLoadingThreads ? (
            <Text>{t('messages.loadingThreads', 'Loading message threads...')}</Text>
          ) : currentThreads && currentThreads.length > 0 ? (
            <div className="space-y-4">
              {currentThreads.map((thread) => (
                <div key={thread.id} className="border rounded-lg overflow-hidden">
                  <div 
                    className={`p-4 flex items-center justify-between cursor-pointer transition  ${
                      hasUnreadMessages(thread) ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => toggleThreadCollapse(thread.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Heading level="h3" className="text-base font-medium">
                          {thread.subject || t('messages.noSubject', 'No Subject')}
                        </Heading>
                        
                        {/* Show customer email badge in user tab */}
                        {activeTab === 'user' && (thread.customer_email || thread.metadata?.customer_email) && (
                          <Badge className="ml-2 bg-blue-50 text-blue-700">
                            {thread.customer_email || thread.metadata?.customer_email}
                          </Badge>
                        )}
                        
                        {hasUnreadMessages(thread) && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">{t('messages.new', 'New')}</Badge>
                        )}
                      </div>
                      <Text className="text-sm text-gray-500">
                        {thread.subject ? (
                          <span className="font-medium">{thread.subject} • </span>
                        ) : (
                          <span className="font-medium">{t('messages.noSubject', 'No Subject')} • </span>
                        )}
                        {formatDate(thread.created_at)}
                      </Text>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: activeTab === 'admin' ? '#3B82F6' : '#6366F1'
                        }}
                      >
                        {activeTab === 'admin' ? 'A' : 'C'}
                      </div>
                      {collapsedThreads[thread.id] ? 
                        <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                        <ChevronUpMini className="w-4 h-4 text-gray-500" />
                      }
                    </div>
                  </div>
                  {!collapsedThreads[thread.id] && (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <Text className="text-sm text-gray-500">{t('messages.conversation', 'Conversation with')}:</Text>
                        <Button 
                          variant="secondary" 
                          size="small"
                          onClick={() => handleReplyToThread(thread.id)}
                          className="flex items-center gap-1"
                        >
                          <ArrowDownLeft className="w-3 h-3" />
                          {t('messages.reply', 'Reply')}
                        </Button>
                      </div>
                      
                      {thread.messages && thread.messages.length > 0 ? (
                        <div className="space-y-4">
                          {/* Reverse the messages to show newest at the bottom */}
                          {[...thread.messages].reverse().map((msg) => (
                            <div key={msg.id} className="flex gap-3">
                              <div className="flex-shrink-0 pt-1">
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                  style={{ 
                                    backgroundColor: msg.sender_type === 'admin' ? '#3B82F6' : 
                                                  msg.sender_type === 'seller' ? '#10B981' : '#6366F1'
                                  }}
                                >
                                  {msg.sender_type === 'admin' ? 'A' : msg.sender_type === 'seller' ? 'Y' : 'C'}
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center mb-1">
                                  <Text className="text-sm font-semibold">{getSenderName(msg.sender_type, thread)}</Text>
                                  <Text className="text-sm ml-2 text-gray-500">{formatDate(msg.created_at)}</Text>
                                </div>
                                <div className="p-3 rounded-lg">
                                  <Text>{msg.content}</Text>
                                  
                                  {msg.attachment_url && (
                                    <div className="mt-2 border rounded-lg p-2 flex items-center gap-2 ">
                                      <PaperClip className="w-4 h-4 text-gray-500" />
                                      <Text className="text-sm">
                                        <a 
                                          href={msg.attachment_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline"
                                        >
                                          {msg.attachment_name || 'Attachment'}
                                        </a>
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Text className="text-gray-500 italic">{t('messages.noMessages', 'No messages in this thread yet.')}</Text>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border rounded-lg">
              <Text className="text-gray-500">{t('messages.noThreadsFound', 'No message threads found.')}</Text>
              <Text className="text-sm text-gray-400 mt-1">{t('messages.startConversation', 'Start a conversation by sending a message above.')}</Text>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('messages.previous', 'Previous')}
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "secondary"}
                    size="small"
                    onClick={() => handlePageChange(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('messages.next', 'Next')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
