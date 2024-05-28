import { Address } from 'viem'
import * as chians from 'viem/chains'

// export const BASE_URL = 'http://192.168.1.18:3000/smev2'
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string
// @ts-ignore
export const chain: chians.Chain = chians[process.env.NEXT_PUBLIC_NETWORK]
export const DECIMAL18 = 10n ** 18n

export type AddressConfig = {
  [k: number]: Address
}

export const MarketAddress: AddressConfig = {
  [chain.id]: process.env.NEXT_PUBLIC_MARKET_ADDRESS as Address,
}

export const GasManagerAddress: AddressConfig = {
  [chain.id]: process.env.NEXT_PUBLIC_SME_GAS_MANAGER as Address,
}

export const FEE_ADDRESS: Address = process.env.NEXT_PUBLIC_FEE_ADDRESS as Address

export const CurrentID = { id: chain.id }

export function getCurrentMarketAddress() {
  return MarketAddress[CurrentID.id]
}

export function getCurrentGasManagerAddress() {
  return GasManagerAddress[CurrentID.id]
}

export function getCurrentExploerUrl() {
  return chain.blockExplorers?.default?.url || ''
}
