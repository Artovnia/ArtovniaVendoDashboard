import { QueryKey, UseQueryOptions } from "@tanstack/react-query"

export type TQueryKey<
  TKey,
  TListQuery = any,
  TDetailQuery = string
> = {
  readonly all: readonly [TKey]
  readonly lists: () => readonly [TKey, "list"]
  readonly list: (
    query?: TListQuery
  ) => readonly (TKey | "list" | { query: TListQuery } | undefined)[]
  readonly details: () => readonly [TKey, "detail"]
  readonly detail: (
    id: TDetailQuery,
    query?: TListQuery
  ) => readonly (
    TKey | "detail" | TDetailQuery | { query: TListQuery } | undefined
  )[]
}

export type UseQueryOptionsWrapper<
  // Return type of queryFn
  TQueryFn = unknown,
  // Type thrown in case the queryFn rejects
  E = Error,
  // Query key type
  TQueryKey extends QueryKey = QueryKey
> = Omit<
  UseQueryOptions<TQueryFn, E, TQueryFn, TQueryKey>,
  "queryKey" | "queryFn"
>

export const queryKeysFactory = <
  T,
  TListQueryType = any,
  TDetailQueryType = string
>(
  globalKey: T
) => {
  const queryKeyFactory: TQueryKey<T, TListQueryType, TDetailQueryType> = {
    all: [globalKey],
    lists: () => [...queryKeyFactory.all, "list"],
    list: (query?: TListQueryType) =>
      [...queryKeyFactory.lists(), query ? { query } : undefined].filter(
        (k) => !!k
      ),
    details: () => [...queryKeyFactory.all, "detail"],
    detail: (id: TDetailQueryType, query?: TListQueryType) =>
      [...queryKeyFactory.details(), id, query ? { query } : undefined].filter(
        (k) => !!k
      ),
  }
  return queryKeyFactory
}
