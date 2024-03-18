import { Address, zeroAddress } from 'viem'
import { UseContractReadConfig, erc20ABI, erc721ABI, useAccount, useBalance, useContractRead } from 'wagmi'
import { TradePair } from '../types'
import { useMemo } from 'react'
import { erc1155ABI } from '../nft'
import { getBigint } from '../utils'
const NATIVE_TOKEN_ADDRESS = zeroAddress

export function useTokenBalance({ address, token }: { address?: Address; token: Address }) {
  const isNative = token == NATIVE_TOKEN_ADDRESS
  const { data: eth } = useBalance({
    address: address,
    enabled: isNative,
  })
  const { data: erc20 } = useContractRead({
    abi: erc20ABI,
    address: token,
    functionName: 'balanceOf',
    args: [address as any],
    enabled: !isNative && !!address,
  })
  const result = isNative ? eth?.value : erc20
  return result || 0n
}

export function useAssetBalance(tp: TradePair) {
  const { address } = useAccount()
  const res = useContractRead({
    abi: tp.assetType == 'ERC1155' ? erc1155ABI : erc20ABI,
    address: tp.asset,
    functionName: 'balanceOf',
    args: tp.assetType == 'ERC1155' ? [address, tp.assetId] : [address],
    enabled: !!address,
  } as any)
  return {
    balance: getBigint(res, 'data'),
  }
}
