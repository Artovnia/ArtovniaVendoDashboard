import { Container, Tabs, Text, Button, Heading, Textarea, Input, Label, Badge } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { PlusMini, ArrowDownLeft, PaperClip, ChevronDown, ChevronUpMini } from "@medusajs/icons";
import { format } from "date-fns";
import { useVendorThreads, useSendVendorMessage, useMarkThreadAsRead, useCustomersDetails, MessageThread as BaseMessageThread } from "../../hooks/api/useMessages";
import { uploadFilesQuery } from "../../lib/client";
import { toast } from "@medusajs/ui";

// Enhanced MessageThread type that includes properties added by the hook
type MessageThread = BaseMessageThread & {
  customer_id?: string | null;
  customer_email?: string | null;
};

export function MessagesPage() {
  const { t } = useTranslation();
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
  }, [threads.length]); // Only depend on threads.length to avoid infinite loops
  
  // Extract unique customer IDs from threads that don't have emails
  const customerIdsToFetch = useMemo(() => {
    if (!data?.threads) return [];
    
    return data.threads
      .filter(thread => {
        // Only fetch if we have a customer_id but no customer_email
        return thread.customer_id && !thread.customer_email;
      })
      .map(thread => thread.customer_id!)
      .filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates
  }, [data?.threads]);

  // Fetch customer details for threads that need email information
  const { data: customersData } = useCustomersDetails(customerIdsToFetch);

  // Create a mapping of customer ID to email for quick lookup
  const customerEmailMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    if (customersData?.customers) {
      customersData.customers.forEach(customerData => {
        const customerId = customerData.id;
        if (customerData?.email) {
          map[customerId] = customerData.email;
        }
      });
    }
    
    return map;
  }, [customersData]);
  
  // Helper function to get sender name based on type
  const getSenderName = (senderType: string, thread?: MessageThread) => {
    switch (senderType) {
      case 'admin':
        return t('messages.senderTypes.admin', 'Admin');
      case 'seller':
        return t('messages.senderTypes.seller', 'You');
      case 'customer':
        // Try to get customer email from thread data or fetched customer data
        const customerEmail = thread?.customer_email || 
          (thread?.customer_id ? customerEmailMap[thread.customer_id] : null);
        return customerEmail || t('messages.senderTypes.customer', 'Customer');
      default:
        return senderType;
    }
  };
  
  // Calculate pagination values using totalCount from the API
  const totalPages = useMemo(() => {
    // Use the count returned from API, or fall back to array length if needed
    const count = totalCount || threads.length;
    return Math.ceil(count / threadsPerPage);
  }, [totalCount, threads.length, threadsPerPage]);

  // Sort threads by creation date, newest first
  const sortedThreads = useMemo(() => {
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
      console.log(`Switching message tab from ${activeTab} to ${tab}`);
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

  // Handle attachment change
  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('messages.fileTooLarge', 'File size must be less than 10MB'));
        return;
      }

      setAttachment(file);
      setAttachmentName(file.name);
      setAttachmentType(file.type);

      // Upload file immediately to get URL
      const formData = new FormData();
      formData.append('files', file);

      uploadFilesQuery(formData)
        .then((response) => {
          if (response.uploads && response.uploads.length > 0) {
            const upload = response.uploads[0];
            setAttachmentUrl(upload.url);
            if (upload.thumbnail_url) {
              setAttachmentThumbnailUrl(upload.thumbnail_url);
            }
          }
        })
        .catch((error) => {
          console.error('File upload failed:', error);
          toast.error(t('messages.uploadFailed', 'File upload failed'));
          clearAttachment();
        });
    }
  };

  // Clear attachment
  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentUrl("");
    setAttachmentName("");
    setAttachmentType("");
    setAttachmentThumbnailUrl("");
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() && !attachmentUrl) {
      toast.error(t('messages.messageRequired', 'Message content is required'));
      return;
    }

    try {
      const messageData = {
        content: message.trim(),
        subject: selectedThreadId ? undefined : subject.trim(),
        thread_id: selectedThreadId || undefined,
        recipient_type: activeTab,
        attachment_url: attachmentUrl || undefined,
        attachment_name: attachmentName || undefined,
        attachment_type: attachmentType || undefined,
        attachment_thumbnail_url: attachmentThumbnailUrl || undefined,
      };

      await sendMessage(messageData);
      
      // Clear form
      setMessage("");
      if (!selectedThreadId) {
        setSubject("");
      }
      clearAttachment();
      
      // Refresh threads
      refetch();
      
      toast.success(t('messages.messageSent', 'Message sent successfully'));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(t('messages.sendFailed', 'Failed to send message'));
    }
  };

  // Handle reply to thread
  const handleReplyToThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowNewMessageForm(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };
  
  return (
    <Container className="p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <Heading level="h1" className="text-2xl font-bold">{t('messages.title', 'Messages')}</Heading>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => handleTabChange(value as 'admin' | 'user')}
        className="mb-6"
      >
        <Tabs.List className="border-b border-ui-border-base w-full">
          <Tabs.Trigger value="admin">{t('messages.admin', 'Admin')}</Tabs.Trigger>
          <Tabs.Trigger value="user">{t('messages.user', 'Clients')}</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
      
      <div className="mb-6">
        <Text className="text-gray-600 mb-4">
          {activeTab === 'admin' 
            ? t('messages.adminDescription', 'Messages from admin')
            : t('messages.userDescription', 'Messages from users')
          }
        </Text>
        
        {showNewMessageForm ? (
          <div className="space-y-4 mb-8 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Heading className="text-lg">{t('messages.newMessage', 'New message')}</Heading>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => setShowNewMessageForm(false)}
              >
                {t('messages.cancel', 'Cancel')}
              </Button>
            </div>
            
            <div>
              <Label htmlFor="subject">{t('messages.subject', 'Subject')}</Label>
              <Input 
                id="subject"
                placeholder={t('messages.subject', 'Subject')} 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!!selectedThreadId}
                required={!selectedThreadId}
              />
            </div>
            
            <div>
              <Label htmlFor="message">{t('messages.message', 'Message')}</Label>
              <Textarea 
                id="message"
                placeholder={t('messages.message', 'Message')} 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div>
              <Label className="font-semibold mb-2 block">{t('messages.attachmentOptional', 'Attachment (optional)')}</Label>
              <div className="flex items-center space-x-2">
                {!attachment ? (
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    {t('messages.attachFile', 'Attach file')}
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleAttachmentChange}
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                    />
                  </label>
                ) : (
                  <div className="mt-2 p-2 rounded border border-gray-300 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <PaperClip className="w-4 h-4" />
                      <span className="text-sm">{attachmentName}</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={clearAttachment}
                    >
                      {t('messages.remove', 'Remove')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMessage}
                disabled={isSending || (!message.trim() && !attachmentUrl)}
              >
                {isSending ? t('messages.sending', 'Sending...') : t('messages.send', 'Send')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <Button 
              onClick={() => setShowNewMessageForm(true)}
              className="flex items-center gap-2"
            >
              <PlusMini />
              {t('messages.newMessage', 'New message')}
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          {isLoadingThreads ? (
            <div className="p-6 text-center">
              <Text>{t('messages.loadingThreads', 'Loading message threads...')}</Text>
            </div>
          ) : sortedThreads.length > 0 ? (
            <div className="space-y-4">
              {sortedThreads.map((thread) => (
                <div key={thread.id} className="border rounded-lg p-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleThreadCollapse(thread.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {hasUnreadMessages(thread) && (
                          <Badge variant="default" className="bg-blue-500 text-white">
                            {t('messages.new', 'New')}
                          </Badge>
                        )}
                        <Heading className="text-md font-semibold">
                          {thread.subject || t('messages.noSubject', 'No subject')}
                        </Heading>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Text className="text-sm text-gray-500">
                        {formatDate(thread.last_message_at || thread.created_at)}
                      </Text>
                      {collapsedThreads[thread.id] ? <ChevronDown /> : <ChevronUpMini />}
                    </div>
                  </div>
                  
                  {!collapsedThreads[thread.id] && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Text className="text-sm text-gray-600">
                          {t('messages.conversation', 'Conversation with')} {getSenderName('customer', thread)}
                        </Text>
                        <Button 
                          variant="secondary" 
                          size="small"
                          onClick={() => handleReplyToThread(thread.id)}
                        >
                          <ArrowDownLeft className="w-4 h-4 mr-1" />
                          {t('messages.reply', 'Reply')}
                        </Button>
                      </div>
                      
                      {thread.messages && thread.messages.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
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
                                    <a 
                                      href={msg.attachment_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      {msg.attachment_name || t('messages.attachment', 'Attachment')}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Text className="text-gray-500 italic">{t('messages.noMessages', 'No messages in this thread.')}</Text>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border rounded-lg">
              <Text className="text-gray-500">{t('messages.noThreadsFound', 'No threads found.')}</Text>
              <Text className="text-sm text-gray-400 mt-1">{t('messages.startConversation', 'Start a new conversation by clicking the New Message button.')}</Text>
            </div>
          )}
          
          {/* Pagination */}
          {totalCount > threadsPerPage && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('messages.previous', 'Previous')}
              </Button>
              <span>
                {t('messages.pagination', 'Page {{current}} of {{total}}', {
                  current: currentPage,
                  total: Math.ceil(totalCount / threadsPerPage)
                })}
              </span>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / threadsPerPage)}
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
