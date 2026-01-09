import { memo } from "react"
import { useTranslation } from "react-i18next"

import { PlaceholderCell } from "../../common/placeholder-cell"
import { HttpTypes } from "@medusajs/types"

type CollectionCellProps = {
  collection?: HttpTypes.AdminCollection | null
}

export const CollectionCell = memo(({ collection }: CollectionCellProps) => {
  
  if (!collection) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">{collection.title}</span>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if collection data changed
  return prevProps.collection?.title === nextProps.collection?.title
})

export const CollectionHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.collection")}</span>
    </div>
  )
}
