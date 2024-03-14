import { Address } from 'wagmi'
import { create } from 'zustand'
import { BASE_URL } from '../config'
import { TradePair } from '../types'

type TP = {
  id: number
  collection_address: Address
  collection_type: number
  token_address: Address
  status: number
  create_time: string
  update_time: string
}

export type UseTradePairs = {
  pairs: TradePair[]
  autoupdate: () => Promise<void>
}
const useTradePairs = create<UseTradePairs>((set) => ({
  pairs: [],
  autoupdate: async () => {
    while (true) {
      try {
        const url = `${BASE_URL}/common/order/tradingPair/list`
        const datas = await fetch(url)
          .then((res) => res.json())
          .then((data) => data.data as TP[])
        const pairs = datas.map<TradePair>((tp) => ({
          id: tp.id.toFixed(),
          assetType: 'ERC1155',
          assetId: 1n,
          asset: tp.collection_address,
          token: tp.token_address,
          tokenSymbol: 'USDC',
        }))
        set({ pairs })
        await new Promise((resolve) => setTimeout(resolve as any, 60 * 60 * 1000))
      } catch (error) {
        console.error('useTradePairs autoupdate', error)
        await new Promise((resolve) => setTimeout(resolve as any, 5 * 1000))
      }
    }
  },
}))
useTradePairs.getState().autoupdate()

export function useGetTradePair(key?: string) {
  const { pairs } = useTradePairs()
  return pairs.find((item) => item.id == key) || pairs[0]
}
