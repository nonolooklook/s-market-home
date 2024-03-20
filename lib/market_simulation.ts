import _ from 'lodash'
import { Address, toHex, zeroAddress } from 'viem'
import { MarketABI } from './abi/MarketAbi'
import { getCurrentMarketAddress } from './config'
import { Clients, ConsiderationItem, ItemType, OfferItem } from './types'
import { parseBn } from './utils'

const ZeroHash: Address = '0x0000000000000000000000000000000000000000000000000000000000000000'
const ZeroAddress: Address = zeroAddress

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
  const counter = 1n
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

  const order = {
    parameters: { ...orderComponents, salt: toHex(salt) },
    signature: '0x',
    numerator: 1, // only used for advanced orders
    denominator: 1, // only used for advanced orders
    extraData: '0x', // only used for advanced orders
  }

  return {
    order,
    orderHash,
    orderComponents,
  }
}

type UnPromise<T> = T extends Promise<infer U> ? U : never

export type CreatedOrder = UnPromise<ReturnType<typeof createOrder>>
