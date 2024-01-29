import { isInteger } from 'lodash'
import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { FEE_ADDRESS } from '../config'
import { CreatedOrder, fillOrders, useClients, useCreateOrder } from '../market'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '../types'
import { handleError, sleep } from '../utils'
import { useAssetBalance } from './useTokenBalance'

export function useDumpSell(tp: TradePair, orders: OrderWrapper[], count: number) {
  const clients = useClients()
  const [loading, setLoading] = useState(false)
  const makerOrders: OrderWrapper[] = useMemo(() => {
    let needCount = count
    return orders.filter((o) => {
      const hasCount = Number(o.detail.parameters.consideration[0].startAmount)
      if (needCount >= hasCount) {
        needCount = needCount - hasCount
        return true
      } else if (needCount > 0) {
        o.detail.numerator = needCount
        o.detail.denominator = Number(o.detail.parameters.consideration[0].endAmount)
        needCount = 0
        return true
      } else {
        return false
      }
    })
  }, [orders, count])
  const { address } = useAccount()
  const { balance } = useAssetBalance(tp)
  const disabledDumpSell =
    !isInteger(count) || !clients.pc || !clients.wc || !address || makerOrders.length <= 0 || BigInt(count) > balance
  const create = useCreateOrder()
  const dumpSell = async () => {
    if (disabledDumpSell) return
    try {
      setLoading(true)
      const fullfillments: MatchOrdersFulfillment[] = []
      const createdOrders: CreatedOrder[] = []
      const mLength = makerOrders.length
      for (let i = 0; i < mLength; ++i) {
        const makerO = makerOrders[i]
        const startAmount =
          (BigInt(makerO.detail.parameters.offer[0].startAmount) * BigInt(makerO.detail.numerator)) /
          BigInt(makerO.detail.denominator)
        const endAmount =
          (BigInt(makerO.detail.parameters.offer[0].endAmount) * BigInt(makerO.detail.numerator)) /
          BigInt(makerO.detail.denominator)
        const countForMaker = (
          (Number(makerO.detail.parameters.consideration[0].startAmount) * makerO.detail.numerator) /
          makerO.detail.denominator
        ).toFixed()
        const createdOrder = await create(
          [
            {
              itemType: assetTypeToItemType(tp.assetType),
              startAmount: countForMaker,
              endAmount: countForMaker,
              token: tp.asset,
              identifierOrCriteria: makerO.detail.parameters.consideration[0].identifierOrCriteria,
            },
          ],
          [
            {
              itemType: ItemType.ERC20.valueOf(),
              identifierOrCriteria: '0',
              startAmount: ((startAmount * 995n) / 1000n).toString(),
              endAmount: ((endAmount * 995n) / 1000n).toString(),
              token: tp.token,
              recipient: address,
            },
            {
              itemType: ItemType.ERC20.valueOf(),
              identifierOrCriteria: '0',
              startAmount: ((startAmount * 5n) / 1000n).toString(),
              endAmount: ((endAmount * 5n) / 1000n).toString(),
              token: tp.token,
              recipient: FEE_ADDRESS,
            },
          ],
          0,
        )
        createdOrders.push(createdOrder)
        fullfillments.push({
          offerComponents: [{ orderIndex: i, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: mLength + i, itemIndex: 0 }],
        })
        fullfillments.push({
          offerComponents: [{ orderIndex: i, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: mLength + i, itemIndex: 1 }],
        })
        fullfillments.push({
          offerComponents: [{ orderIndex: mLength + i, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: i, itemIndex: 0 }],
        })
      }

      await sleep(2000)
      const res = await fillOrders(tp, {
        // randomNumberCount: mLength,
        makerOrders: makerOrders.map((m) => m.detail),
        takerOrders: createdOrders.map((m) => m.order) as any,
        modeOrderFulfillments: fullfillments,
      })
      return res
    } catch (error) {
      handleError(error)
      setLoading(false)
    }
  }
  return { loading, makerOrders, dumpSell, disabledDumpSell, balanceLow: BigInt(count) > balance }
}
