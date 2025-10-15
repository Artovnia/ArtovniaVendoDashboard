import { useQueryParams } from "../../use-query-params"

type UseReturnRequestTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useReturnRequestTableQuery = ({
  prefix,
  pageSize = 20,
}: UseReturnRequestTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "status",
      "order",
    ],
    prefix
  )

  const {
    offset,
    status,
    q,
    order,
  } = queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status?.split(","),
    order: order ? order : "-created_at",
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
