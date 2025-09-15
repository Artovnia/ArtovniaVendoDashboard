import { FetchError } from "@medusajs/js-sdk"
import { AdminPromotion, HttpTypes, LinkMethodRequest } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery, sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { promotionsQueryKeys } from "./promotions"

const REGIONS_QUERY_KEY = "campaigns" as const
export const campaignsQueryKeys = queryKeysFactory(REGIONS_QUERY_KEY)

export const useCampaign = (
  id: string,
  query?: HttpTypes.AdminGetCampaignParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminCampaignResponse,
      FetchError,
      HttpTypes.AdminCampaignResponse & { promotions?: AdminPromotion[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: campaignsQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/campaigns/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    ...options,
  })

  // Strip timestamp from campaign_identifier for display
  const processedData = data ? {
    ...data,
    campaign: data.campaign ? {
      ...data.campaign,
      campaign_identifier: data.campaign.campaign_identifier?.replace(/_\d+$/, '') || data.campaign.campaign_identifier
    } : data.campaign
  } : data

  return { ...processedData, ...rest }
}

export const useCampaigns = (
  query?: HttpTypes.AdminGetCampaignsParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminCampaignListResponse,
      FetchError,
      HttpTypes.AdminCampaignListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/campaigns", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: campaignsQueryKeys.list(query),
    ...options,
  })

  // Strip timestamp from campaign_identifier for display in list
  const processedData = data ? {
    ...data,
    campaigns: data.campaigns?.map(campaign => ({
      ...campaign,
      campaign_identifier: campaign.campaign_identifier?.replace(/_\d+$/, '') || campaign.campaign_identifier
    }))
  } : data

  return { ...processedData, ...rest }
}

export const useCreateCampaign = (
  options?: UseMutationOptions<
    HttpTypes.AdminCampaignResponse,
    FetchError,
    HttpTypes.AdminCreateCampaign
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/campaigns", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateCampaign = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCampaignResponse,
    FetchError,
    HttpTypes.AdminUpdateCampaign
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/campaigns/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCampaign = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.DeleteResponse<"campaign">,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/campaigns/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddOrRemoveCampaignPromotions = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCampaignResponse,
    FetchError,
    LinkMethodRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.campaign.batchPromotions(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}