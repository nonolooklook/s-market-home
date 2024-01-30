import { Address } from 'viem'
import { PublicClient, WalletClient } from 'wagmi'

export enum ItemType {
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
}

export type OfferItem = {
  itemType: number
  token: Address
  identifierOrCriteria: string
  startAmount: string
  endAmount: string
}

export type ConsiderationItem = OfferItem & {
  recipient: Address
}

export type Clients = { wc?: WalletClient | null; pc?: PublicClient }

export type TradePair = {
  id: string
  asset: Address // ERC20 ERC721 ERC1155
  assetType: 'ERC20' | 'ERC721' | 'ERC1155'
  assetId?: bigint
  token: Address
  tokenSymbol: string
}

export function assetTypeToItemType(at: TradePair['assetType']) {
  if (at == 'ERC20') return 1
  if (at == 'ERC1155') return 3
  return 2
}

export type MatchOrdersFulfillment = {
  offerComponents: { orderIndex: number; itemIndex: number }[]
  considerationComponents: { orderIndex: number; itemIndex: number }[]
}

export type OrderParameters = {
  conduitKey: Address
  consideration: ConsiderationItem[]
  endTime: string
  offer: OfferItem[]
  offerer: Address
  orderType: number
  salt: string
  startTime: string
  totalOriginalConsiderationItems: number
  zone: Address
  zoneHash: Address
}

export type Order = {
  denominator: number
  extraData: Address
  numerator: number
  signature: Address
  parameters: OrderParameters
}

export type OrderWrapper = {
  create_time: string
  detail: Order
  expected_price: string
  id: number
  max_price: string
  min_price: string
  nft_address: Address
  offerer: Address
  order_end_time: number
  order_hash: Address
  order_item_size: number
  order_start_time: number
  order_state: number
  order_type: number
  remaining_item_size: number
  token_address: number
  update_time: string
}

// TxStatus
export type TxTaskStatus = {
  collection_address: Address
  create_time: string
  gas_tx_hash: Address
  gas_value: string
  id: number
  last_update_time: string
  match_block_number: number
  match_timestamp: number
  match_tx_hash: string
  order_hash_list: Address[]
  order_probability_detail?: {
    price: number
    itemSize: number
    numerator: number
    orderHash: string
    denominator: number
    itemNumerator: number
    makerOrderHash: number
    itemDenominator: number
  }[]
  prepare_tx_hash: string
  random_strategy: number
  task_detail: {}
  task_hash: string
  task_status: number
  token_address: Address
  trading_pair_id: number
  update_time: string
  vrf_random_tx_hash: string
  vrf_request_id: string

  price: string
}

export const CREATE = 0,
  GAS_PAYED = 1,
  PREPARE_SEND_FAILED = -1,
  PREPARE_SEND_SUCCESS = 2,
  CATCH_RANDOM_RESPONSE = 3,
  SEND_MATCH_ORDER_SUCCESS = 4,
  SEND_MATCH_ORDER_FAILED = -2,
  INVALID_GAS = -3,
  MATCH_SUCCESS = 5

export type DistributionItem = {
  price: number
  expectation: number
}
export type TpOrderDistribution = {
  maxPrice: number
  minPrice: number
  precision: number
  bidExpectationList?: DistributionItem[]
  listExpectationList?: DistributionItem[]
}
