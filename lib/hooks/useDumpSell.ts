import { useTpBalance } from '@/components/TpBalance'
import { useTxStatus } from '@/components/TxStatus'
import _ from 'lodash'
import { useMemo, useRef, useState } from 'react'
import { Address, useAccount } from 'wagmi'
import { fillOrders } from '../api'
import { fillOrders as simFillOrders } from '../api_simulation'
import { FEE_ADDRESS } from '../config'
import { CreatedOrder, createOrder, useClients } from '../market'
import { CreatedOrder as SimCreatedOrder, createOrder as simCreateOrder } from '../market_simulation'
import { getOrderPerMinMax, isSelfMaker } from '../order'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '../types'
import { handleError, parseBn, sleep } from '../utils'
import { useRequestMatchOrder } from './useRequestMatchOrder'
import { isPROD } from '../env'

export function useDumpSell(tp: TradePair, orders: OrderWrapper[], count: number, onSuccess?: () => void, isSimulation?: boolean) {
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
      const totalCount = BigInt(o.detail.parameters.consideration[0].endAmount)
      if (needCount >= hasCount) {
        needCount = needCount - hasCount
        if (totalCount !== hasCount) {
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
  const { data: [balance] = [0n, 0n] } = useTpBalance(tp, isSimulation)
  const disabledDumpSell = isPROD || !clients.pc || !clients.wc || !address || makerOrders.length <= 0 || countBn > balance
  const reqMatchOrder = useRequestMatchOrder()
  const refRetry = useRef<() => any>()
  const txs = useTxStatus({
    onRetry: () => refRetry.current?.(),
    isSimulation,
  })
  const dumpSell = async () => {
    if (disabledDumpSell || loading) return
    try {
      setLoading(true)
      txs.setTypeStep({ type: 'loading' })
      txs.setTxsOpen(true)
      const fullfillments: MatchOrdersFulfillment[] = []
      const createdOrders: (CreatedOrder | SimCreatedOrder)[] = []
      const mLength = makerOrders.length
      for (let i = 0; i < mLength; ++i) {
        const makerO = makerOrders[i]
        const numerator = BigInt(makerO.detail.numerator)
        const denominator = BigInt(makerO.detail.denominator)
        const startAmount = (BigInt(makerO.detail.parameters.offer[0].startAmount) * numerator) / denominator
        const endAmount = (BigInt(makerO.detail.parameters.offer[0].endAmount) * numerator) / denominator
        const countForMaker = (BigInt(makerO.detail.parameters.consideration[0].startAmount) * numerator) / denominator
        const takerOrder = await (isSimulation ? simCreateOrder : createOrder)(
          clients,
          address,
          [
            {
              itemType: assetTypeToItemType(tp.assetType),
              startAmount: countForMaker.toString(),
              endAmount: countForMaker.toString(),
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
        createdOrders.push(takerOrder)
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
      const res = await (isSimulation ? simFillOrders : fillOrders)(tp, {
        // randomNumberCount: mLength,
        makerOrders: makerOrders.map((m) => m.detail),
        takerOrders: createdOrders.map((m) => m.order) as any,
        modeOrderFulfillments: fullfillments,
      })
      const hashes = makerOrders.map<Address>((m) => m.order_hash).concat(createdOrders.map<Address>((m) => m.orderHash))
      !isSimulation && (await reqMatchOrder(hashes))
      const minmaxs = makerOrders.map((m) => {
        const [min, max] = getOrderPerMinMax(m.detail, tp)
        return { min, max }
      })
      const success = await txs.intevalCheckStatus(res.hash, minmaxs)
      success && onSuccess && onSuccess()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      txs.setTypeStep({ type: 'fail' })
      handleError(error)
    }
  }
  refRetry.current = dumpSell
  return { loading, makerOrders, dumpSell, disabledDumpSell, balanceLow: countBn > balance, txs }
}
