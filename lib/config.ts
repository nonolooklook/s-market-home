import { Address } from 'viem'
import { sepolia, arbitrumSepolia } from 'viem/chains'
import { isPROD } from './env'

// export const BASE_URL = 'http://192.168.1.18:3000/smev2'
export const BASE_URL = isPROD ? 'https://sme-demo.mcglobal.ai/smev2' : 'https://sme-demo.mcglobal.ai/smev2'

export const DECIMAL18 = 10n ** 18n

export type AddressConfig = {
  [k: number]: Address
}

export const MarketAddress: AddressConfig = {
  [sepolia.id]: '0x89e160AA023C1b90bD382dc84196036B50F79A4E',
  [arbitrumSepolia.id]: '0x89e160AA023C1b90bD382dc84196036B50F79A4E',
}

export const GasManagerAddress: AddressConfig = {
  [sepolia.id]: '0xDa2986353d15b7CfFA631c3035465A25555Ab0dd',
  [arbitrumSepolia.id]: '0xaa3a7a72FfFcCDA9381454aF377757bfD326B3b4',
}

export const FEE_ADDRESS: Address = '0xB888488186c59A5bB905cb883f15FC802eF3D588'

export const ScanUrl: { [k: number]: string } = {
  [sepolia.id]: 'https://sepolia.ethereum.io',
  [arbitrumSepolia.id]: arbitrumSepolia.blockExplorers.default.url,
}

export const CurrentID = { id: arbitrumSepolia.id }

export function getCurrentMarketAddress() {
  return MarketAddress[CurrentID.id]
}

export function getCurrentGasManagerAddress() {
  return GasManagerAddress[CurrentID.id]
}

export function getCurrentExploerUrl() {
  return ScanUrl[CurrentID.id]
}
