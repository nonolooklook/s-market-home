import { useMemo, useState } from 'react'
import { fillOrders, postOrder, useClients, useCreateOrder } from '../market'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '../types'
import { useAccount } from 'wagmi'
import { handleError, sleep } from '../utils'
import { useTokenBalance } from './useTokenBalance'
import { isInteger } from 'lodash'

export function useDumpBuy(tp: TradePair, orders: OrderWrapper[], count: number) {
  const clients = useClients()
  const [loading, setLoading] = useState(false)
  const makerOrders: OrderWrapper[] = useMemo(() => {
    let needCount = count
    return orders.filter((o) => {
      const hasCount = Number(o.detail.parameters.offer[0].startAmount)
      if (needCount >= hasCount) {
        needCount = needCount - hasCount
        return true
      } else if (needCount > 0) {
        o.detail.numerator = needCount
        o.detail.denominator = Number(o.detail.parameters.offer[0].endAmount)
        needCount = 0
        return true
      } else {
        return false
      }
    })
  }, [orders, count])
  const { address } = useAccount()
  const balance = useTokenBalance({ address, token: tp.token })
  const [needStart, needEnd] = makerOrders.reduce(
    ([start, end], o) => [
      o.detail.parameters.consideration.reduce(
        (csum, c) => (BigInt(c.startAmount) * BigInt(o.detail.numerator)) / BigInt(o.detail.denominator) + csum,
        0n,
      ) + start,
      o.detail.parameters.consideration.reduce(
        (csum, c) => (BigInt(c.endAmount) * BigInt(o.detail.numerator)) / BigInt(o.detail.denominator) + csum,
        0n,
      ) + end,
    ],
    [0n, 0n],
  )
  const disabledDumpBuy =
    !isInteger(count) || !clients.pc || !clients.wc || !address || makerOrders.length <= 0 || needEnd > balance
  const create = useCreateOrder()

  const dumpBuy = async () => {
    if (disabledDumpBuy) return
    try {
      setLoading(true)
      const createOrder = await create(
        [
          {
            itemType: ItemType.ERC20.valueOf(),
            startAmount: needStart.toString(),
            endAmount: needEnd.toString(),
            token: tp.token,
            identifierOrCriteria: '0',
          },
        ],
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            startAmount: count.toFixed(),
            endAmount: count.toFixed(),
            token: tp.asset,
            identifierOrCriteria: makerOrders[0].detail.parameters.offer[0].identifierOrCriteria,
            recipient: address,
          },
        ],
        0,
      )
      const fullfillments: MatchOrdersFulfillment[] = []
      const mLength = makerOrders.length
      makerOrders.forEach((m, index) => {
        fullfillments.push({
          offerComponents: [{ orderIndex: index, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: mLength, itemIndex: 0 }],
        })
        m.detail.parameters.consideration.forEach((c, cIndex) => {
          fullfillments.push({
            offerComponents: [{ orderIndex: mLength, itemIndex: 0 }],
            considerationComponents: [{ orderIndex: index, itemIndex: cIndex }],
          })
        })
      })
      await sleep(2000)
      const res = await fillOrders(tp, {
        // randomNumberCount: mLength,
        makerOrders: makerOrders.map((m) => m.detail),
        takerOrders: [createOrder.order as any],
        modeOrderFulfillments: fullfillments,
      })
      return res
    } catch (error) {
      handleError(error)
      setLoading(false)
    }
  }
  return { loading, makerOrders, dumpBuy, disabledDumpBuy, balanceLow: needEnd > balance }
}
