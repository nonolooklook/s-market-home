import { Address, useQuery } from 'wagmi'
import { TradePair } from '../types'
import { BASE_URL } from '../config'

type TP = {
  id: number
  collection_address: Address
  collection_type: number
  token_address: Address
  status: number
  create_time: string
  update_time: string
}

export function useTradePairs(): {
  pairs: TradePair[]
  loading: boolean
} {
  const url = `${BASE_URL}/common/order/tradingPair/list`
  const { data = [], isLoading } = useQuery([url], ({ signal }) =>
    fetch(url, { signal })
      .then((res) => res.json())
      .then((data) => data.data as TP[]),
  )
  return {
    loading: isLoading,
    pairs: data.map<TradePair>((tp) => ({
      id: tp.id.toFixed(),
      assetType: 'ERC1155',
      assetId: 1n,
      asset: tp.collection_address,
      token: tp.token_address,
      tokenSymbol: 'USDC',
    })),
  }
}

export function useGetTradePair(key?: string) {
  const { pairs } = useTradePairs()
  return pairs.find((item) => item.id == key) || pairs[0]
}
