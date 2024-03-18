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
  assetImg?: string
  assetId?: bigint
  name: string
  token: Address
  tokenSymbol: string
  tradeInfo: TradePairDetails['collectionDetail']['trading_info']
}

export function assetTypeToItemType(at: TradePair['assetType'], bid?: boolean) {
  if (at == 'ERC20') return 1
  if (at == 'ERC1155') return 3
  return bid ? 4 : 2
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
  denominator: string
  extraData: Address
  numerator: string
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
  remaining_item_size: string
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

interface Fee {
  fee: number
  required: boolean
  recipient: string
}

interface Rarity {
  max_rank: number
  strategy_id: string
  calculated_at: string
  tokens_scored: number
  strategy_version: string
}

interface Contract {
  chain: string
  address: string
}

interface PaymentToken {
  name: string
  chain: string
  image: string
  symbol: string
  address: string
  decimals: number
  eth_price: string
  usd_price: string
}

interface CollectionDetail {
  id: number
  name: string
  icon_url: string
  contract_address: string
  collection_slug: string
  contract_type: number
  status: number
  index_base_info: number
  index_trading_info: number
  base_info: {
    fees: Fee[]
    name: string
    owner: string
    rarity: Rarity
    editors: string[]
    is_nsfw: boolean
    category: string
    wiki_url: string
    contracts: Contract[]
    image_url: string
    imageUrl: string
    collection: string
    description: string
    discord_url: string
    is_disabled: boolean
    opensea_url: string
    project_url: string
    created_date: string
    telegram_url: string
    total_supply: number
    payment_tokens: PaymentToken[]
    safelist_status: string
    banner_image_url: string
    twitter_username: string
    instagram_username: string
    trait_offers_enabled: boolean
    collection_offers_enabled: boolean
  }
  trading_info: {
    owners: number
    sales24: number
    volume24: number
    marketCap?: number
    floorPrice?: number
    price?: number
    totalSupply: number
    volumeChange24: string
  }
  sort: number
  last_index_base_time: string
  last_index_trading_time: string
  create_time: string
  update_time: string
}

interface TokenDetail {
  id: number
  name: string
  icon_url: string | null
  contract_address: string
  fsyms: string
  status: number
  index_base_info: number
  index_trading_info: number
  base_info: {
    imageUrl: string
  }
  trading_info: {
    price: number
    change24: string
    volume24: number
    marketCap: number
  }
  sort: number
  last_index_base_time: string
  last_index_trading_time: string
  create_time: string
  update_time: string
}

export interface TradePairDetails {
  floorPrice?: string
  price?: string
  collectionDetail: CollectionDetail
  tokenDetail: TokenDetail
  volume24: string
  volume48: string
  topBid: string
}
