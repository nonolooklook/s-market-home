import { Address } from 'viem'
import * as chians from 'viem/chains'
import { ENV_KEYS } from './server_const'

export type EnvKey = (typeof ENV_KEYS)[number]
export const ENVS = JSON.parse(document.getElementById('__envs__')?.textContent as string) as {
  [k in EnvKey]: string
}

// export const BASE_URL = 'http://192.168.1.18:3000/smev2'
export const BASE_URL = ENVS.BASE_URL
// @ts-ignore
export const chain: chians.Chain = chians[ENVS.NETWORK]
export const DECIMAL18 = 10n ** 18n

export type AddressConfig = {
  [k: number]: Address
}

export const MarketAddress: AddressConfig = {
  [chain.id]: ENVS.MARKET_ADDRESS as Address,
}

export const GasManagerAddress: AddressConfig = {
  [chain.id]: ENVS.SME_GAS_MANAGER as Address,
}

export const FEE_ADDRESS: Address = ENVS.FEE_ADDRESS as Address

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
