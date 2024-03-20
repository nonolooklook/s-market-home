import { Address } from 'wagmi'
import { create } from 'zustand'
import { apiGet } from '../api'
import { TradePair, TradePairDetails } from '../types'

type TP = {
  id: number
  collection_address: Address
  collection_type: number
  token_address: Address
  token_id: number
  name: string
  status: number
  create_time: string
  update_time: string
}

export type UseTradePairs = {
  pairs: TradePair[]
  autoupdate: () => Promise<void>
}
export const useTradePairs = create<UseTradePairs>((set) => ({
  pairs: [],
  autoupdate: async () => {
    while (true) {
      try {
        const datas = await apiGet<TP[]>(`/common/order/tradingPair/list`)
        const details = await Promise.all(
          datas.map((tp) => apiGet<TradePairDetails>(`/common/order/tradingPair/${tp.id}/collection/detail`)),
        )
        const pairs = datas.map<TradePair>((tp, index) => {
          const assetType = tp.collection_type == 1 ? 'ERC1155' : tp.collection_type == 0 ? 'ERC20' : 'ERC721'
          const assetId = tp.token_id ? BigInt(tp.token_id) : 0n
          const assetImg =
            details?.[index]?.collectionDetail?.base_info?.imageUrl ||
            details?.[index]?.collectionDetail?.base_info?.image_url
          const name =
            details?.[index]?.collectionDetail?.name || details?.[index]?.collectionDetail?.base_info?.name || ''
          const assetName = assetType == 'ERC1155' ? `${name} #${assetId}` : name
          return {
            id: tp.id.toFixed(),
            assetType,
            assetId,
            assetImg,
            name,
            assetName,
            asset: tp.collection_address,
            token: tp.token_address,
            tokenSymbol: details?.[index]?.tokenDetail?.name || '-',
            tradeInfo: details?.[index]?.collectionDetail?.trading_info,
          }
        })
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
