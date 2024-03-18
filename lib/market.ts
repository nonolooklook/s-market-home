import _ from 'lodash'
import { Address, zeroAddress, hexToBigInt, toHex } from 'viem'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { MarketABI } from './abi/MarketAbi'
import { approveOffer } from './nft'
import {
  Clients,
  ConsiderationItem,
  ItemType,
  MATCH_SUCCESS,
  MatchOrdersFulfillment,
  OfferItem,
  Order,
  PREPARE_SEND_SUCCESS,
  TradePair,
  TxTaskStatus,
} from './types'
import { parseBn, sleep, toJson } from './utils'
import { BASE_URL, getCurrentMarketAddress } from './config'
import { toast } from 'sonner'
import { apiGet, apiPost } from './api'

export function getOfferOrConsiderationItem<T extends ConsiderationItem | OfferItem>(
  itemType: ItemType,
  token: Address,
  identifierOrCriteria: string,
  startAmount: string,
  endAmount: string,
  recipient?: Address,
): T {
  const offerItem: OfferItem = {
    itemType: itemType.valueOf(),
    token,
    identifierOrCriteria,
    startAmount,
    endAmount,
  }
  if (recipient) {
    return {
      ...offerItem,
      recipient: recipient as string,
    } as T
  }
  return offerItem as T
}

const ZeroHash: Address = '0x0000000000000000000000000000000000000000000000000000000000000000'
const ZeroAddress: Address = zeroAddress

export function useClients(): Clients {
  const wc = useWalletClient()
  const pc = usePublicClient()
  return {
    wc: wc.data,
    pc: pc,
  }
}

export async function createOrder(
  clients: Clients,
  offerer: Address,
  offer: OfferItem[],
  consideration: ConsiderationItem[],
  orderType: number,
) {
  const { wc, pc } = clients
  if (!wc || !pc) throw 'Not connected'
  const marketAddress: Address = getCurrentMarketAddress()
  console.info('createOrder:', offer, marketAddress)
  for (const offerItem of offer) {
    if (offerItem.itemType > 3 || offerItem.itemType < 1) {
      throw 'Not support offer type'
    }
    await approveOffer(clients, offerItem, offerer, marketAddress)
  }
  const counter = await pc.readContract({
    abi: MarketABI,
    address: marketAddress,
    functionName: 'getCounter',
    args: [offerer],
  })
  const salt = BigInt(_.random(1, 100000000000).toFixed() + _.random(1, 100000000000).toFixed())
  const orderParameters = {
    offerer: offerer,
    zone: ZeroAddress,
    offer: offer.map((o) => ({
      ...o,
      identifierOrCriteria: BigInt(o.identifierOrCriteria),
      startAmount: BigInt(o.startAmount),
      endAmount: BigInt(o.endAmount),
    })),
    consideration: consideration.map((c) => ({
      ...c,
      identifierOrCriteria: BigInt(c.identifierOrCriteria),
      startAmount: BigInt(c.startAmount),
      endAmount: BigInt(c.endAmount),
    })),
    totalOriginalConsiderationItems: consideration.length,
    orderType,
    zoneHash: ZeroHash,
    salt,
    conduitKey: ZeroHash,
    startTime: 0n,
    endTime: parseBn((_.now() / 1000 + 60 * 60 * 24 * 90).toFixed(), 0),
  }

  const orderComponents = {
    ...orderParameters,
    counter,
  }

  const orderHash = await pc.readContract({
    abi: MarketABI,
    address: marketAddress,
    functionName: 'getOrderHash',
    args: [orderComponents],
  })

  const [isValidated, isCancelled, totalFilled, totalSize] = await pc.readContract({
    abi: MarketABI,
    address: marketAddress,
    functionName: 'getOrderStatus',
    args: [orderHash],
  })
  if (isCancelled) throw 'Is Cancelled'

  const orderStatus = {
    isValidated,
    isCancelled,
    totalFilled,
    totalSize,
  }
  const domainData = {
    name: 'SmeMarket',
    version: '2.0',
    chainId: await wc.getChainId(),
    verifyingContract: marketAddress,
  }
  const OrderTypeS = {
    OrderComponents: [
      { name: 'offerer', type: 'address' },
      { name: 'zone', type: 'address' },
      { name: 'offer', type: 'OfferItem[]' },
      { name: 'consideration', type: 'ConsiderationItem[]' },
      { name: 'orderType', type: 'uint8' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'zoneHash', type: 'bytes32' },
      { name: 'salt', type: 'uint256' },
      { name: 'conduitKey', type: 'bytes32' },
      { name: 'counter', type: 'uint256' },
    ],
    OfferItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
    ],
    ConsiderationItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
  }

  const flatSig = await wc.signTypedData({
    account: offerer,
    domain: domainData,
    types: OrderTypeS,
    primaryType: 'OrderComponents',
    message: orderComponents,
  })

  const order = {
    parameters: { ...orderComponents, salt: toHex(salt) },
    signature: flatSig,
    numerator: 1, // only used for advanced orders
    denominator: 1, // only used for advanced orders
    extraData: '0x', // only used for advanced orders
  }

  return {
    order,
    orderHash,
    orderStatus,
    orderComponents,
  }
}

export function useCreateOrder() {
  const clients = useClients()
  const account = useAccount()
  const create = (offer: OfferItem[], consideration: ConsiderationItem[], orderType: number) => {
    console.info('acc:', account)
    if (!account || !account.address) throw 'Not connected'
    return createOrder(clients, account.address, offer, consideration, orderType)
  }
  return create
}

type UnPromise<T> = T extends Promise<infer U> ? U : never

export type CreatedOrder = UnPromise<ReturnType<typeof createOrder>>

export async function postOrder(tp: TradePair, order: CreatedOrder) {
  if (!order) throw 'Order is empty'
  await apiPost(`/common/order/tradingPair/${tp.id}/create`, {
    hash: order.orderHash,
    entry: order.order,
  })
}

export async function fillOrders(
  tp: TradePair,
  data: {
    makerOrders: Order[]
    takerOrders: Order[]
    modeOrderFulfillments: MatchOrdersFulfillment[]
  },
) {
  const res = await apiPost<{ hash: string }>(`/common/order/tradingPair/${tp.id}/fillOrder`, data)
  if (!res?.hash) throw 'Fill order error'
  return res
}

export async function loopCheckFillOrders(res: UnPromise<ReturnType<typeof fillOrders>>, action: string) {
  while (true) {
    const r2 = await apiGet<TxTaskStatus>(`/common/order/task/${res.hash}/detail`).catch(() => null)
    if (r2?.task_status && r2?.task_status >= PREPARE_SEND_SUCCESS && r2?.task_status < MATCH_SUCCESS) {
      toast.info('ChainLink random number requested')
    }
    if (r2?.task_status === MATCH_SUCCESS && r2?.order_probability_detail && r2?.order_probability_detail.length > 0) {
      // r2.order_probability_detail
      toast.success(`${action} success`)
      break
    }
    if ((r2?.task_status || 0) < 0) {
      toast.error(`${action} error!`)
      break
    }
    await sleep(5000)
  }
}
