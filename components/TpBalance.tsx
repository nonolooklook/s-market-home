import { getUserBalance } from '@/lib/api_simulation'
import { erc1155ABI } from '@/lib/nft'
import { TradePair } from '@/lib/types'
import { displayBn, parseBn, toJson } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import React, { ForwardedRef } from 'react'
import { erc20ABI, useAccount, usePublicClient } from 'wagmi'

export function useTpBalance(tp: TradePair, isSimulation?: boolean) {
  const { address } = useAccount()
  const pc = usePublicClient()
  const isErc20 = tp.assetType == 'ERC20'
  const assetDecimals = isErc20 ? 18 : 0
  return useQuery({
    queryKey: [toJson(tp), isSimulation, !!pc, address],
    queryFn: async () => {
      if (!address || !pc) return
      if (isSimulation) {
        const res = await getUserBalance(address)
        console.info('tpbalance:', res)
        const asset =
          res.find((item) => item.collection_address == tp.asset && item.token_id.toFixed() == tp.assetId?.toString())
            ?.amount || '0'
        const token = res.find((item) => item.collection_address == tp.token)?.amount || '0'
        return [parseBn(asset, assetDecimals), parseBn(token, 18)]
      } else {
        const [asset, token] = await Promise.all([
          pc.readContract({
            abi: tp.assetType == 'ERC1155' ? erc1155ABI : erc20ABI,
            functionName: 'balanceOf',
            address: tp.asset,
            args: tp.assetType == 'ERC1155' ? [address, tp.assetId] : [address],
          } as any),
          pc.readContract({
            abi: erc20ABI,
            functionName: 'balanceOf',
            address: tp.token,
            args: [address],
          } as any),
        ])
        console.info('tpbalance:', asset, token)
        return [asset, token] as [bigint, bigint]
      }
    },
  })
}

function TpBalance_(
  {
    tp,
    isSimulation,
  }: {
    tp: TradePair
    isSimulation: boolean
  },
  ref?: ForwardedRef<(() => void) | null>,
) {
  const isErc20 = tp.assetType == 'ERC20'
  const assetDecimals = isErc20 ? 18 : 0
  const { data = [0n, 0n], refetch } = useTpBalance(tp, isSimulation)
  ref && (typeof ref == 'function' ? ref(refetch) : (ref.current = refetch))
  return (
    <div className='text-slate-600'>
      <div>
        <span className='font-medium text-slate-900'>{tp.assetName}: </span>
        {displayBn(data[0], isErc20 ? 2 : 0, assetDecimals)}
      </div>
      <div>
        <span className='font-medium text-slate-900'>{tp.tokenSymbol}: </span>
        {displayBn(data[1])}
      </div>
    </div>
  )
}

export const TpBalance = React.forwardRef(TpBalance_)
