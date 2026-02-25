import { useEffect, useState } from "react"
import { useOnboarding, useOrders } from "../../hooks/api"
import { DashboardCharts } from "./components/dashboard-charts"
import { DashboardOnboarding } from "./components/dashboard-onboarding"
import { ChartSkeleton } from "./components/chart-skeleton"
import { useReviews } from "../../hooks/api/review"

const FULFILLED_STATUSES = [
  "fulfilled",
  "shipped",
  "partially_shipped",
  "partially_fulfilled",
  "delivered",
  "partially_delivered",
]

export const Dashboard = () => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  const { onboarding, isError, error, isPending } = useOnboarding()

  const {
    count: notFulfilledOrders,
    isPending: isPendingNotFulfilledOrders,
  } = useOrders({
    limit: 1,
    offset: 0,
    fields: "id",
    fulfillment_status: "not_fulfilled",
  }, {
    staleTime: 30_000,
  })

  const {
    count: fulfilledOrders,
    isPending: isPendingFulfilledOrders,
  } = useOrders({
    limit: 1,
    offset: 0,
    fields: "id",
    fulfillment_status: FULFILLED_STATUSES,
  }, {
    staleTime: 30_000,
  })

  const { reviews, isPending: isPendingReviews } = useReviews()

  const reviewsToReply =
    reviews?.filter((review: any) => !review.seller_note).length || 0

  if (!isClient) return null

  if (
    isPending ||
    isPendingNotFulfilledOrders ||
    isPendingFulfilledOrders ||
    isPendingReviews
  ) {
    return (
      <div>
        <ChartSkeleton />
      </div>
    )
  }

  if (isError) {
    throw error
  }

  if (
    !onboarding?.products ||
    !onboarding?.locations_shipping ||
    !onboarding?.store_information
    // !onboarding?.stripe_connection
  )
    return (
      <DashboardOnboarding
        products={onboarding?.products}
        locations_shipping={onboarding?.locations_shipping}
        store_information={onboarding?.store_information}
        stripe_connection={onboarding?.stripe_connection}
      />
    )

  return (
    <DashboardCharts
      notFulfilledOrders={notFulfilledOrders ?? 0}
      fulfilledOrders={fulfilledOrders ?? 0}
      reviewsToReply={reviewsToReply}
    />
  )
}