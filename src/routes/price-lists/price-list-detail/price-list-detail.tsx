import { useParams } from "react-router-dom"

import { usePriceList } from "../../../hooks/api/price-lists"
import { PriceListConfigurationSection } from "./components/price-list-configuration-section"
import { PriceListGeneralSection } from "./components/price-list-general-section"
import { PriceListProductSection } from "./components/price-list-product-section"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"

export const PriceListDetails = () => {
  const { id } = useParams()

  const { price_list, isLoading, isError, error } = usePriceList(id!, {
    // Don't include 'products' field as it's not supported by the backend
    fields: "*",
  })

  const { getWidgets } = useDashboardExtension()

  // Handle different response formats
  let list = null
  if (price_list) {
    if (Array.isArray(price_list)) {
      list = price_list[0]
    } else if (typeof price_list === 'object') {
      list = price_list
    }
  }

  // Add debug logging
  console.log('Price list data:', price_list)
  console.log('Processed price list:', list)
  
  // Ensure the price list has a prices array
  if (list && !list.prices && price_list?.prices) {
    list = { ...list, prices: price_list.prices }
    console.log('Added prices to list:', list.prices)
  }

  if (isLoading || !list) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("price_list.details.after"),
        before: getWidgets("price_list.details.before"),
        sideAfter: getWidgets("price_list.details.side.after"),
        sideBefore: getWidgets("price_list.details.side.before"),
      }}
      data={price_list}
    >
      <TwoColumnPage.Main>
        <PriceListGeneralSection priceList={list} />
        <PriceListProductSection priceList={list} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <PriceListConfigurationSection priceList={list} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}