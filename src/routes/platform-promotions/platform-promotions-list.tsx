import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Button,
  Container,
  Heading,
  Input,
  Text,
  Badge,
  Skeleton,
  Alert,
} from "@medusajs/ui"
import { MagnifyingGlass, Plus, Calendar, Tag } from "@medusajs/icons"
import { usePlatformPromotions } from "../../hooks/api/platform-promotions"
import { PlatformPromotionCard } from "./components/platform-promotion-card"

const LIMIT = 20

export const PlatformPromotionsList = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [offset, setOffset] = useState(0)

  const {
    data,
    isLoading,
    error,
    isError,
  } = usePlatformPromotions({
    q: searchQuery || undefined,
    limit: LIMIT,
    offset,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setOffset(0) // Reset pagination when searching
  }

  const handleNextPage = () => {
    setOffset(prev => prev + LIMIT)
  }

  const handlePrevPage = () => {
    setOffset(prev => Math.max(0, prev - LIMIT))
  }

  if (isError) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-2">
            <Tag className="text-ui-fg-base" />
            <Heading level="h2">{t("platformPromotions.list.title")}</Heading>
          </div>
        </div>
        <div className="px-6 py-4">
          <Alert variant="error">
            <Text>{t("platformPromotions.errorLoadingPromotions")}: {error?.message}</Text>
          </Alert>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Tag className="text-ui-fg-base" />
          <Heading level="h2">{t("platformPromotions.list.title")}</Heading>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-4">
        <Text className="text-ui-fg-subtle">
          {t("platformPromotions.subtitle")}
        </Text>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-x-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-fg-muted" />
            <Input
              placeholder={t("platformPromotions.list.search.placeholder")}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Container key={index} className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-base">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </Container>
            ))}
          </div>
        ) : !data?.promotions?.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-subtle">
              <Tag className="h-8 w-8 text-ui-fg-subtle" />
            </div>
            <div className="mt-4 text-center">
              <Heading level="h3" className="text-ui-fg-base">
                {searchQuery 
                  ? t("general.noSearchResults")
                  : t("platformPromotions.list.empty.heading")
                }
              </Heading>
              <Text className="mt-1 text-ui-fg-subtle">
                {searchQuery 
                  ? t("general.noResultsMessage")
                  : t("platformPromotions.list.empty.message")
                }
              </Text>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.promotions.map((promotion) => (
              <PlatformPromotionCard
                key={promotion.id}
                promotion={promotion}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.promotions.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <Text className="text-ui-fg-subtle">
              {t("platformPromotions.showingResults", { start: offset + 1, end: Math.min(offset + LIMIT, data.count), total: data.count })}
            </Text>
            <div className="flex items-center gap-x-2">
              <Button
                variant="secondary"
                size="small"
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                {t("general.prev")}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleNextPage}
                disabled={offset + LIMIT >= data.count}
              >
                {t("general.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
