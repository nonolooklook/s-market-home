import _ from 'lodash'
import { useMemo, useRef, useState } from 'react'
import { Address, useAccount } from 'wagmi'
import { fillOrders, loopCheckFillOrders, useClients, useCreateOrder } from '../market'
import { getOrderPerMinMax, isSelfMaker } from '../order'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '../types'
import { handleError, parseBn, sleep } from '../utils'
import { useRequestMatchOrder } from './useRequestMatchOrder'
import { useTokenBalance } from './useTokenBalance'
import { useTxStatus } from '@/components/TxStatus'

export function useDumpBuy(tp: TradePair, orders: OrderWrapper[], count: number, onSuccess?: () => void) {
  const clients = useClients()
  const [loading, setLoading] = useState(false)
  const isErc20 = tp.assetType === 'ERC20'
  const assetDecimals = isErc20 ? 18 : 0
  const countBn = parseBn(count.toString(), assetDecimals)
  const makerOrders: OrderWrapper[] = useMemo(() => {
    if (count <= 0) return []
    let needCount = countBn
    return orders.map<OrderWrapper>(_.cloneDeep).filter((o) => {
      if (isSelfMaker(o.detail)) return false
      const hasCount = parseBn(o.remaining_item_size, assetDecimals)
      const totalCount = BigInt(o.detail.parameters.offer[0].endAmount)
      if (needCount >= hasCount) {
        needCount = needCount - hasCount
        if (hasCount != totalCount) {
          o.detail.numerator = hasCount.toString()
          o.detail.denominator = totalCount.toString()
        }
        return true
      } else if (needCount > 0) {
        o.detail.numerator = needCount.toString()
        o.detail.denominator = totalCount.toString()
        needCount = 0n
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
  const disabledDumpBuy = !clients.pc || !clients.wc || !address || makerOrders.length <= 0 || needEnd > balance
  const create = useCreateOrder()
  const reqMatchOrder = useRequestMatchOrder()
  const refRetry = useRef<() => any>()
  const txs = useTxStatus(() => refRetry.current && refRetry.current())
  const dumpBuy = async () => {
    if (disabledDumpBuy) return
    try {
      setLoading(true)
      txs.setTypeStep({ type: 'loading' })
      txs.setTxsOpen(true)
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
            startAmount: countBn.toString(),
            endAmount: countBn.toString(),
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
      const hashes = makerOrders.map<Address>((m) => m.order_hash).concat([createOrder.orderHash])
      await reqMatchOrder(hashes)
      const success =  await txs.intevalCheckStatus(res.hash, getOrderPerMinMax(makerOrders[0].detail, tp))
      success && onSuccess && onSuccess()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      txs.setTypeStep({ type: 'fail' })
      handleError(error)
    }
  }
  refRetry.current = dumpBuy
  return { loading, makerOrders, dumpBuy, disabledDumpBuy, balanceLow: needEnd > balance, txs }
}
