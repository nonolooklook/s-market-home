import _ from 'lodash'
import { Address, toHex, zeroAddress } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { MarketABI } from './abi/MarketAbi'
import { getCurrentMarketAddress } from './config'
import { approveOffer } from './nft'
import {
  Clients,
  ConsiderationItem,
  OfferItem
} from './types'
import { parseBn } from './utils'

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


type UnPromise<T> = T extends Promise<infer U> ? U : never

export type CreatedOrder = UnPromise<ReturnType<typeof createOrder>>
