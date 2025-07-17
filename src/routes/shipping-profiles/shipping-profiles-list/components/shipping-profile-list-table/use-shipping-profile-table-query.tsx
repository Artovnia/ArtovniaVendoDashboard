import { useQueryParams } from "../../../../../hooks/use-query-params"

export const useShippingProfileTableQuery = ({
  prefix,
}: {
  prefix?: string
}) => {
  const raw = useQueryParams(
    ["q", "order", "created_at", "updated_at", "name", "type"],
    prefix
  )

  const searchParams = {
    q: raw.q,
    order: raw.order,
    created_at: raw.created_at ? JSON.parse(raw.created_at) : undefined,
    updated_at: raw.updated_at ? JSON.parse(raw.updated_at) : undefined,
    name: raw.name,
    type: raw.type,
  }

  return {
    searchParams,
    raw,
  }
}
