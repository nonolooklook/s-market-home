import { useRequestMatchOrder } from '@/lib/hooks/useRequestMatchOrder'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { fillOrders, useCreateOrder } from '@/lib/market'
import { getOrderEPbigint, getOrderPerMinMax, getOrderPerMinMaxBigint } from '@/lib/order'
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
import { Button } from '../ui/button'

export function BuyForList({
  open,
  onOpenChange,
  tp,
  order,
}: DialogBaseProps & { tp: TradePair; order: OrderWrapper }) {
  const { address } = useAccount()
  const [amount, setAmount] = useState('1')
  const maxAmount = order.remaining_item_size || 0
  const [min, max] = getOrderPerMinMaxBigint(order.detail)
  const mid = getOrderEPbigint(order.detail)
  useEffect(() => setAmount(maxAmount.toFixed()), [maxAmount])
  const reqMatchOrder = useRequestMatchOrder()
  const { txsOpen, txsProps, setTxsOpen, setTypeStep, intevalCheckStatus } = useTxStatus(() => fillSellOrder())
  const collateralBalance = useTokenBalance({ address, token: tp.token })
  const canBuy =
    collateralBalance >= (parseBn(amount) * parseBn(order.max_price)) / 10n ** 18n && Number(amount) <= maxAmount
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
      const csd = order.detail.parameters.consideration
      const identifer = order.detail.parameters.offer[0].identifierOrCriteria
      const count = BigInt(order.detail.parameters.offer[0].startAmount)
      const startAmount = csd.reduce((amount: bigint, cv) => BigInt(cv.startAmount) + amount, 0n)
      const endAmount = csd.reduce((amount: bigint, cv) => BigInt(cv.endAmount) + amount, 0n)
      const startOfferAmount = (startAmount * BigInt(amount)) / count
      const endOfferAmount = (endAmount * BigInt(amount)) / count
      // console.info('amount:', startAmount, endAmount, startOfferAmount, endOfferAmount)
      const createdOrder = await create(
        [
          {
            itemType: ItemType.ERC20.valueOf(),
            startAmount: startOfferAmount.toString(),
            endAmount: endOfferAmount.toString(),
            token: tp.token,
            identifierOrCriteria: '0',
          },
        ],
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            startAmount: amount,
            endAmount: amount,
            token: tp.asset,
            identifierOrCriteria: identifer,
            recipient: address,
          },
        ],
        0,
      )
      // partail count
      order.detail.numerator = Number(amount)
      order.detail.denominator = Number(count)
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
          offerComponents: [{ orderIndex: 1, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: 0, itemIndex: 1 }],
        },
      ]
      await sleep(2000)
      const res = await fillOrders(tp, {
        takerOrders: [createdOrder.order as any],
        makerOrders: [order.detail],
        modeOrderFulfillments: modeOrderFulfillments,
      })

      console.log(res)
      if (!res?.data?.hash) {
        setTypeStep({ type: 'fail' })
        return
      }
      // do request match order;
      await reqMatchOrder([order.order_hash, createdOrder.orderHash] as any)
      intevalCheckStatus(res.data.hash, getOrderPerMinMax(order.detail))
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
          <div className='flex justify-center my-2'>
            <Button onClick={fillSellOrder} disabled={!canBuy}>
              {canBuy ? 'Buy' : 'Not enough'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {txsOpen && <TxStatus {...txsProps} />}
    </>
  )
}