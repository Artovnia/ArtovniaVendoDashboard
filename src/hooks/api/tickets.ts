import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { FetchError } from "@medusajs/js-sdk"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const VENDOR_TICKETS_QUERY_KEY = "vendor-tickets" as const
export const vendorTicketsQueryKeys = queryKeysFactory(VENDOR_TICKETS_QUERY_KEY)

export type TicketAttachment = {
  id: string
  filename: string
  original_filename: string
  url: string
  mime_type: string
  size: number
  uploaded_by_type: string
  uploaded_by_id?: string
  created_at: Date
}

export type TicketMessage = {
  id: string
  ticket_id: string
  content: string
  author_type: "customer" | "admin"
  author_id?: string
  author_name: string
  is_internal: boolean
  created_at: Date
  attachments?: TicketAttachment[]
}

export type Ticket = {
  id: string
  ticket_number: string
  title: string
  description: string
  type: "feature_request" | "bug_report" | "support" | "other"
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  customer_id: string
  customer_email: string
  customer_name: string
  assigned_to?: string
  resolved_at?: Date
  closed_at?: Date
  created_at: Date
  updated_at: Date
  messages?: TicketMessage[]
}

type TicketListResponse = {
  tickets: Ticket[]
  count: number
  limit: number
  offset: number
}

type TicketResponse = {
  ticket: Ticket
}

type TicketsQueryParams = {
  status?: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
  type?: "feature_request" | "bug_report" | "support" | "other"
  limit?: number
  offset?: number
  order?: string
  q?: string
}

type CreateTicketInput = {
  title: string
  description: string
  type: "feature_request" | "bug_report" | "support" | "other"
  priority?: "low" | "medium" | "high" | "urgent"
  files?: File[]
}

type UpdateTicketInput = {
  status?: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
  priority?: "low" | "medium" | "high" | "urgent"
}

type AddMessageInput = {
  content: string
  files?: File[]
}

export const useVendorTickets = (
  query?: TicketsQueryParams,
  options?: Omit<
    UseQueryOptions<
      TicketListResponse,
      FetchError,
      TicketListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const params: Record<string, any> = {}
  
  if (query?.limit !== undefined) params.limit = query.limit
  if (query?.offset !== undefined) params.offset = query.offset
  if (query?.status) params.status = query.status
  if (query?.type) params.type = query.type
  if (query?.order) params.order = query.order
  if (query?.q) params.q = query.q

  const { data, ...rest } = useQuery({
    queryFn: async () => fetchQuery("/vendor/tickets", { method: "GET", query: params }),
    queryKey: vendorTicketsQueryKeys.list(params),
    ...options,
  })

  const processedTickets = data?.tickets?.map((ticket: any) => ({
    ...ticket,
    created_at: ticket.created_at ? new Date(ticket.created_at) : new Date(),
    updated_at: ticket.updated_at ? new Date(ticket.updated_at) : new Date(),
    resolved_at: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
    closed_at: ticket.closed_at ? new Date(ticket.closed_at) : undefined,
  })) || []

  return {
    tickets: processedTickets,
    count: data?.count || 0,
    ...rest,
  }
}

export const useVendorTicket = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      TicketResponse,
      FetchError,
      TicketResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => fetchQuery(`/vendor/tickets/${id}`, { method: "GET" }),
    queryKey: vendorTicketsQueryKeys.detail(id),
    enabled: !!id,
    ...options,
  })

  const processedTicket = data?.ticket ? {
    ...data.ticket,
    created_at: data.ticket.created_at ? new Date(data.ticket.created_at) : new Date(),
    updated_at: data.ticket.updated_at ? new Date(data.ticket.updated_at) : new Date(),
    resolved_at: data.ticket.resolved_at ? new Date(data.ticket.resolved_at) : undefined,
    closed_at: data.ticket.closed_at ? new Date(data.ticket.closed_at) : undefined,
    messages: data.ticket.messages?.map((msg: any) => ({
      ...msg,
      created_at: msg.created_at ? new Date(msg.created_at) : new Date(),
      attachments: msg.attachments?.map((att: any) => ({
        ...att,
        created_at: att.created_at ? new Date(att.created_at) : new Date(),
      })),
    })),
  } : undefined

  return {
    ticket: processedTicket,
    ...rest,
  }
}

export const useCreateVendorTicket = (
  options?: UseMutationOptions<
    TicketResponse,
    FetchError,
    CreateTicketInput
  >
) => {
  const mutation = useMutation({
    mutationFn: async (data: CreateTicketInput) => {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("description", data.description)
      formData.append("type", data.type)
      if (data.priority) formData.append("priority", data.priority)
      
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append("files", file)
        })
      }

      return await fetchQuery("/vendor/tickets", {
        method: "POST",
        body: formData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorTicketsQueryKeys.lists() })
    },
    ...options,
  })

  return {
    createTicket: mutation.mutateAsync,
    ...mutation,
  }
}

export const useUpdateVendorTicket = (
  options?: UseMutationOptions<
    TicketResponse,
    FetchError,
    { id: string; data: UpdateTicketInput }
  >
) => {
  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketInput }) => {
      return await fetchQuery(`/vendor/tickets/${id}`, {
        method: "POST",
        body: data,
      })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vendorTicketsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorTicketsQueryKeys.detail(id) })
    },
    ...options,
  })

  return {
    updateTicket: mutation.mutateAsync,
    ...mutation,
  }
}

export const useAddVendorTicketMessage = (
  options?: UseMutationOptions<
    { message: TicketMessage },
    FetchError,
    { ticketId: string; data: AddMessageInput }
  >
) => {
  const mutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: AddMessageInput }) => {
      const formData = new FormData()
      formData.append("content", data.content)
      
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append("files", file)
        })
      }

      return await fetchQuery(`/vendor/tickets/${ticketId}/messages`, {
        method: "POST",
        body: formData,
      })
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: vendorTicketsQueryKeys.detail(ticketId) })
    },
    ...options,
  })

  return {
    addMessage: mutation.mutateAsync,
    ...mutation,
  }
}
