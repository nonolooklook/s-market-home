import { FEE_ADDRESS } from '@/lib/config'
import { useRequestMatchOrder } from '@/lib/hooks/useRequestMatchOrder'
import { useAssetBalance } from '@/lib/hooks/useTokenBalance'
import { fillOrders, useCreateOrder } from '@/lib/market'
import { getOrderEPbigint, getOrderMinMaxBigint, getOrderPerMinMax } from '@/lib/order'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '@/lib/types'
import { displayBn, handleError, parseBn, sleep, toJson } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { BetaD3Chart } from '../BetaD3Chart'
import { InputQuantityValue } from '../InputQuantity'
import { MinMax } from '../MinMax'
import { TradePairPrice } from '../TradePairPrice'
import { TxStatus, useTxStatus } from '../TxStatus'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'

export function SellForBid({
  open,
  onOpenChange,
  tp,
  order,
}: DialogBaseProps & { tp: TradePair; order: OrderWrapper }) {
  const { address } = useAccount()
  const [amount, setAmount] = useState('1')
  const maxAmount = order.remaining_item_size || 0
  const [min, max] = getOrderMinMaxBigint(order)
  const mid = getOrderEPbigint(order)
  useEffect(() => setAmount(maxAmount.toFixed()), [maxAmount])
  const reqMatchOrder = useRequestMatchOrder()
  const { txsOpen, txsProps, setTxsOpen, setTypeStep, intevalCheckStatus } = useTxStatus(() => fillSellOrder())
  const { balance } = useAssetBalance(tp)
  const canBuy = Number(amount) <= maxAmount && balance >= BigInt(amount)
  const create = useCreateOrder()
  const fillSellOrder = async () => {
    try {
      if (Number(amount) <= 0) {
        toast.error("Amount can't be less than or equal to 0")
        return
      }
      if (!address) return
      setTypeStep({ type: 'loading' })
      setTxsOpen(true)
      const offer = order.detail.parameters.offer
      const identifer = order.detail.parameters.consideration[0].identifierOrCriteria
      const count = BigInt(order.detail.parameters.consideration[0].startAmount)
      const startAmount =
        (offer.reduce((amount: bigint, cv) => BigInt(cv.startAmount) + amount, 0n) * BigInt(amount)) / count
      const endAmount =
        (offer.reduce((amount: bigint, cv) => BigInt(cv.endAmount) + amount, 0n) * BigInt(amount)) / count

      const createdOrder = await create(
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            startAmount: amount,
            endAmount: amount,
            token: tp.asset,
            identifierOrCriteria: identifer,
          },
        ],
        [
          {
            itemType: ItemType.ERC20.valueOf(),
            identifierOrCriteria: '0',
            startAmount: ((BigInt(startAmount) * 995n) / 1000n).toString(),
            endAmount: ((BigInt(endAmount) * 995n) / 1000n).toString(),
            token: tp.token,
            recipient: address,
          },
          {
            itemType: ItemType.ERC20.valueOf(),
            identifierOrCriteria: '0',
            startAmount: ((BigInt(startAmount) * 5n) / 1000n).toString(),
            endAmount: ((BigInt(endAmount) * 5n) / 1000n).toString(),
            token: tp.token,
            recipient: FEE_ADDRESS,
          },
        ],
        0,
      )
      // partail count
      createdOrder.order.numerator = Number(amount)
      createdOrder.order.denominator = Number(count)
      const modeOrderFulfillments: MatchOrdersFulfillment[] = [
        {
          offerComponents: [{ orderIndex: 0, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: 1, itemIndex: 0 }],
        },
        {
          offerComponents: [{ orderIndex: 1, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: 0, itemIndex: 0 }],
        },
        {
          offerComponents: [{ orderIndex: 0, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: 1, itemIndex: 1 }],
        },
      ]
      await sleep(2000)
      const res = await fillOrders(tp, {
        takerOrders: [createdOrder.order as any],
        makerOrders: [order.detail],
        modeOrderFulfillments: modeOrderFulfillments,
      })
      console.log(res)
      if (!res?.data?.status) {
        setTypeStep({ type: 'fail' })
        return
      }
      // do request match order;
      await reqMatchOrder([order.order_hash, createdOrder.orderHash] as any)
      intevalCheckStatus(res.data.data.requestId, getOrderPerMinMax(order))
    } catch (e: any) {
      setTypeStep({ type: 'fail' })
      handleError(e)
    }
  }
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='dialog-content w-[660px]' onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogTitle className='dialog-title'>Buy</DialogTitle>
          <TradePairPrice tp={tp} />
          <BetaD3Chart minPrice={min} expectedPrice={mid} maxPrice={max} showType='left' defaultValue={30} />
          <MinMax min={displayBn(min) as any} max={displayBn(max) as any} disableInput={true} />
          <InputQuantityValue
            amount={amount}
            setAmount={setAmount}
            value={`${displayBn((parseBn(amount as `${number}`) * max) / 10n ** 18n)} ${tp.tokenSymbol}`}
          />
          <AuthBalanceFee token={tp.token} auth={(parseBn(amount as `${number}`) * max) / 10n ** 18n} balance />
          <div className='flex justify-center mb-4 mt-6'>
            <button className={'btn-primary w-[170px]'} onClick={fillSellOrder} disabled={!canBuy}>
              {canBuy ? 'Buy' : 'Not enough'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {txsOpen && <TxStatus {...txsProps} />}
    </>
  )
}
