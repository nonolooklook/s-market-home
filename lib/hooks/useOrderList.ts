import { useQuery } from 'wagmi'
import { OrderWrapper, TradePair } from '../types'
import { BASE_URL } from '../config'

export function useOrderList(tp: TradePair) {
  const url = `${BASE_URL}/common/order/list?tradingPairId=${tp.id}&nftAddress=${tp.asset}&tokenAddress=${tp.token}`
  return useQuery(
    [url],
    ({ signal }) =>
      fetch(url, { signal })
        .then((res) => res.json())
        .then((body) => {
          return body.data as OrderWrapper[]
        }),
    { cacheTime: 1000 },
  )
}
