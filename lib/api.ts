import { QueryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { BASE_URL } from './config'
import { MatchOrdersFulfillment, Order, OrderWrapper, TpOrderDistribution, TradePair, TradePairDetails } from './types'
import { toJson } from './utils'
import { CreatedOrder } from './market'
import { Address } from 'viem'

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

export function useApiPost<T>(path: `/${string}`, body?: any) {
  return useMutation<T>({
    mutationKey: [path, body],
    mutationFn: () => apiPost<T>(path, body),
  })
}

export function useApiGet<TData>(path: `/${string}`, options?: QueryOptions<TData>) {
  const url = createUrl(path)
  return useQuery<TData>({
    queryKey: [url],
    queryFn: ({ signal }) => fetch(url, { signal }).then(fetchCovert<TData>),
    ...(options || {}),
  })
}

/********************************************************** apis */

export async function postOrder(tp: TradePair, order: CreatedOrder) {
  if (!order) throw 'Order is empty'
  await apiPost(`/common/order/tradingPair/${tp.id}/create`, {
    hash: order.orderHash,
    entry: order.order,
  })
}

export async function fillOrders(
  tp: TradePair,
  data: {
    makerOrders: Order[]
    takerOrders: Order[]
    modeOrderFulfillments: MatchOrdersFulfillment[]
  },
) {
  const res = await apiPost<{ hash: string }>(`/common/order/tradingPair/${tp.id}/fillOrder`, data)
  if (!res?.hash) throw 'Fill order error'
  return res
}

export async function getOrderList(params: {
  tradingPairId?: string | number
  offerer?: string | Address
  nftAddress: string
  tokenAddress: string
}) {
  const querys = Object.keys(params)
    .map((key) => ((params as any)[key] != undefined ? `${key}=${(params as any)[key]}` : ''))
    .join('&')
  return await apiGet<OrderWrapper[]>(`/common/order/list?${querys}`)
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
