import { QueryOptions, useQuery } from '@tanstack/react-query'
import { BASE_URL } from './config'
import { OrderWrapper, TpOrderDistribution, TradePair, TradePairDetails } from './types'
import { toJson } from './utils'

function createUrl(path: `/${string}`) {
  return `${BASE_URL}${path}`
}

async function fetchCovert<T>(res: Response) {
  const body = await res.json()
  return body.data as T
}

export async function apiGet<T>(path: `/${string}`) {
  return await fetch(createUrl(path)).then(fetchCovert<T>)
}

export async function apiPost<T>(path: `/${string}`, body: any) {
  return await fetch(createUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: toJson(body),
  }).then(fetchCovert<T>)
}

export function useApiGet<TData>(path: `/${string}`, options?: QueryOptions<TData>) {
  const url = createUrl(path)
  return useQuery<TData>({
    queryKey: [url],
    queryFn: ({ signal }) => fetch(url, { signal }).then(fetchCovert<TData>),
    ...(options || {}),
  })
}

export function useTradePairDetail(id: string) {
  return useApiGet<TradePairDetails>(`/common/order/tradingPair/${id}/collection/detail`)
}

export function useOrderList(tp: TradePair) {
  return useApiGet<OrderWrapper[]>(
    `/common/order/list?tradingPairId=${tp.id}&nftAddress=${tp.asset}&tokenAddress=${tp.token}`,
  )
}

export function useTpOrderDistribution(tp: TradePair, precision: number, pointSize: number = 25) {
  return useApiGet<TpOrderDistribution>(
    `/common/order/tradingPair/${tp.id}/distribution?precision=${precision}&pointSize=${pointSize}`,
  )
}
