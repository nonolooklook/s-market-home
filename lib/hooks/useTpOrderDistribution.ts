import { useQuery } from 'wagmi'
import { TpOrderDistribution, TradePair } from '../types'
import { BASE_URL } from '../config'

export function useTpOrderDistribution(tp: TradePair, precision: number, pointSize: number = 25) {
  const url = `${BASE_URL}/common/order/tradingPair/${tp.id}/distribution?precision=${precision}&pointSize=${pointSize}`
  return useQuery([url], ({ signal }) =>
    fetch(url, { signal })
      .then((res) => res.json())
      .then((data) => data.data as TpOrderDistribution),
  )
}
