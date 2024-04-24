import { FEE_ADDRESS } from '@/lib/config'
import { createOrder } from '@/lib/market_simulation'
import { getOrderEPbigint, getOrderPerMinMax, getOrderPerMinMaxBigint } from '@/lib/order'
import { ItemType, MatchOrdersFulfillment, OrderWrapper, TradePair, assetTypeToItemType } from '@/lib/types'
import { displayBn, fmtBn, handleError, parseBn, sleep } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import AssetInput from '../AssetInput'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { BetaD3Chart } from '../BetaD3Chart'
import { MinMax } from '../MinMax'
import { useTpBalance } from '../TpBalance'
import { TradePairPrice } from '../TradePairPrice'
import { TxStatus, useTxStatus } from '../TxStatus'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'
import { fillOrders } from '@/lib/api_simulation'
import { useClients } from '@/lib/market'

export function SellForBid({
  open,
  onOpenChange,
  tp,
  order,
  onSuccess,
}: DialogBaseProps & { tp: TradePair; order: OrderWrapper }) {
  const { address } = useAccount()
  const isErc20 = tp.assetType === 'ERC20'
  const asseetDecimals = isErc20 ? 18 : 0
  const [amount, setAmount] = useState('1')
  const amountBn = parseBn(amount, asseetDecimals)
  const maxAmountBn = parseBn(order.remaining_item_size, asseetDecimals)
  const maxAmount = fmtBn(maxAmountBn, asseetDecimals)
  const [min, max] = getOrderPerMinMaxBigint(order.detail, tp)
  const mid = getOrderEPbigint(order.detail, tp)
  useEffect(() => setAmount(maxAmount), [maxAmount])

  const { txsOpen, txsProps, setTxsOpen, setTypeStep, intevalCheckStatus } = useTxStatus({
    tp,
    onRetry: () => fillSellOrder(),
    onBack: () => onOpenChange?.(false),
    isSimulation: true,
  })
  const { data: [balance] = [0n, 0n] } = useTpBalance(tp, true)
  const canSell = amountBn > 0n && amountBn <= maxAmountBn && balance >= amountBn
  const clients = useClients()
  const fillSellOrder = async () => {
    try {
      if (!address) return
      setTypeStep({ type: 'loading' })
      setTxsOpen(true)
      const offer = order.detail.parameters.offer
      const identifer = order.detail.parameters.consideration[0].identifierOrCriteria
      const count = BigInt(order.detail.parameters.consideration[0].startAmount)
      const startAmount = (offer.reduce((amount: bigint, cv) => BigInt(cv.startAmount) + amount, 0n) * amountBn) / count
      const endAmount = (offer.reduce((amount: bigint, cv) => BigInt(cv.endAmount) + amount, 0n) * amountBn) / count

      const takerOrder = await createOrder(
        clients,
        address,
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            startAmount: amountBn.toString(),
            endAmount: amountBn.toString(),
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
          offerComponents: [{ orderIndex: 0, itemIndex: 0 }],
          considerationComponents: [{ orderIndex: 1, itemIndex: 1 }],
        },
      ]
      await sleep(2000)
      const res = await fillOrders(tp, {
        takerOrders: [takerOrder.order as any],
        makerOrders: [order.detail],
        modeOrderFulfillments: modeOrderFulfillments,
      })
      // do request match order;
      const success = await intevalCheckStatus(res.hash, getOrderPerMinMax(order.detail, tp))
      success && onSuccess && onSuccess()
    } catch (e: any) {
      setTypeStep({ type: 'fail' })
      handleError(e)
    }
  }
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='dialog-content w-[660px]' onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogTitle className='dialog-title'>Sell</DialogTitle>
          <TradePairPrice tp={tp} />
          <BetaD3Chart minPrice={min} expectedPrice={mid} maxPrice={max} showType='right' defaultValue={70} />
          <MinMax min={displayBn(min) as any} max={displayBn(max) as any} disableInput={true} />
          <AssetInput isErc20={isErc20} amount={amount} setAmount={setAmount} max={maxAmountBn} />
          <AuthBalanceFee fee />
          <div className='flex justify-center mb-4 mt-6'>
            <Button onClick={fillSellOrder} disabled={!canSell}>
              Sell
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {txsOpen && <TxStatus {...txsProps} />}
    </>
  )
}
