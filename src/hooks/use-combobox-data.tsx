import {
  QueryKey,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query"
import { useDebouncedSearch } from "./use-debounced-search"

type ComboboxExternalData = {
  offset: number
  limit: number
  count: number
}

type ComboboxQueryParams = {
  q?: string
  offset?: number
  limit?: number
}

export const useComboboxData = <
  TResponse extends ComboboxExternalData,
  TParams extends ComboboxQueryParams,
>({
  queryKey,
  queryFn,
  getOptions,
  defaultValue,
  defaultValueKey,
  pageSize = 10,
}: {
  queryKey: QueryKey
  queryFn: (params: TParams) => Promise<TResponse>
  getOptions: (data: TResponse) => { label: string; value: string }[]
  defaultValueKey?: keyof TParams
  defaultValue?: string | string[]
  pageSize?: number
}) => {
  const { searchValue, onSearchValueChange, query } = useDebouncedSearch()

  const queryInitialDataBy = defaultValueKey || "id"
  const { data: initialData } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      return queryFn({
        [queryInitialDataBy]: defaultValue,
        limit: Array.isArray(defaultValue) ? defaultValue.length : 1,
      } as TParams)
    },
    enabled: !!defaultValue,
  })

  const { data, ...rest } = useInfiniteQuery({
    queryKey: [...queryKey, query],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await queryFn({
        q: query,
        limit: pageSize,
        offset: pageParam,
      } as TParams)
      
    
      
      return result
  },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Check if lastPage exists and has count
      if (!lastPage || typeof lastPage.count !== 'number') {
        return undefined
      }
      
      // offset can be 0, so check for undefined/null specifically
      const currentOffset = typeof lastPage.offset === 'number' ? lastPage.offset : 0
      const currentLimit = typeof lastPage.limit === 'number' ? lastPage.limit : pageSize
      
      const moreItemsExist = lastPage.count > currentOffset + currentLimit
      const nextOffset = moreItemsExist ? currentOffset + currentLimit : undefined
      

      
      return nextOffset
    },
    placeholderData: keepPreviousData,
  });

  const options = data?.pages.flatMap((page) => getOptions(page)) ?? []
  const defaultOptions = initialData ? getOptions(initialData) : []

  /**
   * If there are no options and the query is empty, then the combobox should be disabled,
   * as there is no data to search for.
   */
  const disabled = !rest.isPending && !options.length && !searchValue

  // make sure that the default value is included in the options
  if (defaultValue && defaultOptions.length && !searchValue) {
    defaultOptions.forEach((option) => {
      if (!options.find((o) => o.value === option.value)) {
        options.unshift(option)
      }
    })
  }

  return {
    options,
    searchValue,
    onSearchValueChange,
    disabled,
    ...rest,
  }
}
