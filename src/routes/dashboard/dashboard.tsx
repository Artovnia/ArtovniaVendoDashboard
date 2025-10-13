import { useEffect, useState } from "react"
import { useOnboarding, useOrders } from "../../hooks/api"
import { DashboardCharts } from "./components/dashboard-charts"
import { DashboardOnboarding } from "./components/dashboard-onboarding"
import { ChartSkeleton } from "./components/chart-skeleton"
import { useReviews } from "../../hooks/api/review"

export const Dashboard = () => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  const { onboarding, isError, error, isPending } = useOnboarding()

  // Fetch all orders with explicit limit to get accurate counts
  const { orders, isPending: isPendingOrders } = useOrders({
    limit: 1000,
    offset: 0,
  })
  const { reviews, isPending: isPendingReviews } = useReviews()

  const notFulfilledOrders =
    orders?.filter((order) => order.fulfillment_status === "not_fulfilled")
      .length || 0
  const fulfilledOrders =
    orders?.filter((order) => 
      order.fulfillment_status === "fulfilled" ||
      order.fulfillment_status === "shipped" ||
      order.fulfillment_status === "partially_shipped" ||
      order.fulfillment_status === "partially_fulfilled" ||
      order.fulfillment_status === "delivered" ||
      order.fulfillment_status === "partially_delivered"
    ).length || 0
  const reviewsToReply =
    reviews?.filter((review: any) => !review.seller_note).length || 0

  // Debug logging to verify counts
  if (orders && orders.length > 0) {
    console.log('📊 Dashboard Orders Debug:', {
      totalOrders: orders.length,
      notFulfilled: notFulfilledOrders,
      fulfilled: fulfilledOrders,
      statusBreakdown: orders.reduce((acc, order) => {
        acc[order.fulfillment_status] = (acc[order.fulfillment_status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
  }

  if (!isClient) return null

  if (isPending || isPendingOrders || isPendingReviews) {
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
    // !onboarding?.stripe_connect
  )
    return (
      <DashboardOnboarding
        products={onboarding?.products}
        locations_shipping={onboarding?.locations_shipping}
        store_information={onboarding?.store_information}
        stripe_connect={onboarding?.stripe_connect}
      />
    )

  return (
    <DashboardCharts
      notFulfilledOrders={notFulfilledOrders}
      fulfilledOrders={fulfilledOrders}
      reviewsToReply={reviewsToReply}
    />
  )
}