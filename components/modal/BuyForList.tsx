import { useRequestMatchOrder } from '@/lib/hooks/useRequestMatchOrder'
import { createOrder, useClients } from '@/lib/market'
import { getOrderEPbigint, getOrderPerMinMax, getOrderPerMinMaxBigint } from '@/lib/order'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '@/lib/types'
import { displayBn, fmtBn, handleError, parseBn, sleep } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { BetaD3Chart } from '../BetaD3Chart'
import { InputQuantityValue } from '../InputQuantity'
import { MinMax } from '../MinMax'
import { useTpBalance } from '../TpBalance'
import { TradePairPrice } from '../TradePairPrice'
import { TxStatus, useTxStatus } from '../TxStatus'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'
import { fillOrders } from '@/lib/api'

export function BuyForList({
  open,
  onOpenChange,
  tp,
  order,
}: DialogBaseProps & { tp: TradePair; order: OrderWrapper }) {
  const isErc20 = tp.assetType === 'ERC20'
  const asseetDecimals = isErc20 ? 18 : 0
  const { address } = useAccount()
  const [amount, setAmount] = useState('1')
  const amountBn = parseBn(amount, asseetDecimals)
  const maxAmountBn = parseBn(order.remaining_item_size, asseetDecimals)
  const maxAmount = fmtBn(maxAmountBn, asseetDecimals)

  const [min, max] = getOrderPerMinMaxBigint(order.detail, tp)
  const mid = getOrderEPbigint(order.detail, tp)
  useEffect(() => setAmount(maxAmount), [maxAmount])
  const reqMatchOrder = useRequestMatchOrder()
  const { txsOpen, txsProps, setTxsOpen, setTypeStep, intevalCheckStatus } = useTxStatus({
    onRetry: () => fillSellOrder(),
    onBack: () => onOpenChange?.(false),
  })
  const { data: [, balance] = [0n, 0n] } = useTpBalance(tp, true)
  const canBuy =
    amountBn > 0n && balance >= (parseBn(amount) * parseBn(order.max_price)) / 10n ** 18n && amountBn <= maxAmountBn
  const clients = useClients()
  const fillSellOrder = async () => {
    try {
      if (!address) return
      setTypeStep({ type: 'loading' })
      setTxsOpen(true)
      const csd = order.detail.parameters.consideration
      const identifer = order.detail.parameters.offer[0].identifierOrCriteria
      const count = BigInt(order.detail.parameters.offer[0].startAmount)
      const startAmount = csd.reduce((amount: bigint, cv) => BigInt(cv.startAmount) + amount, 0n)
      const endAmount = csd.reduce((amount: bigint, cv) => BigInt(cv.endAmount) + amount, 0n)
      const startOfferAmount = (startAmount * amountBn) / count
      const endOfferAmount = (endAmount * amountBn) / count
      // console.info('amount:', startAmount, endAmount, startOfferAmount, endOfferAmount)
      const createdOrder = await createOrder(
        clients,
        address,
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
            startAmount: amountBn.toString(),
            endAmount: amountBn.toString(),
            token: tp.asset,
            identifierOrCriteria: identifer,
            recipient: address,
          },
        ],
        0,
      )
      // partail count
      order.detail.numerator = amountBn == count ? '1' : amountBn.toString()
      order.detail.denominator = amountBn == count ? '1' : count.toString()
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
      // do request match order;
      await reqMatchOrder([order.order_hash, createdOrder.orderHash] as any)
      await intevalCheckStatus(res.hash, getOrderPerMinMax(order.detail, tp))
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
            isErc20={isErc20}
            amount={amount}
            setAmount={setAmount}
            value={`${displayBn((parseBn(amount as `${number}`) * max) / 10n ** 18n)} ${tp.tokenSymbol}`}
          />
          <AuthBalanceFee auth={(parseBn(amount as `${number}`) * max) / 10n ** 18n} balance={balance} />
          <div className='flex justify-center my-2'>
            <Button onClick={fillSellOrder} disabled={!canBuy}>
              Buy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {txsOpen && <TxStatus {...txsProps} />}
    </>
  )
}
