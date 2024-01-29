import { BetaD3Chart } from '@/components/BetaD3Chart'
import { InputWithButton } from '@/components/InputWithButton'
import { Spinner } from '@/components/Spinner'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { postOrder, useCreateOrder } from '@/lib/market'
import { ItemType, TradePair, assetTypeToItemType } from '@/lib/types'
import { displayBn as displayBalance, parseBn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { MinMax } from '../MinMax'
import { TradePairPrice } from '../TradePairPrice'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'
import _ from 'lodash'

export const PlaceBid = ({
  open,
  onOpenChange,
  tp,
}: DialogBaseProps & {
  tp: TradePair
}) => {
  const [[min, max], setMinMax] = useState<[`${number}`, `${number}`]>(['8', '10'])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('1')
  const account = useAccount()
  const balance = useTokenBalance({ address: account?.address, token: tp.token })
  const enableBid = balance >= parseBn(max as `${number}`) * parseBn(amount as `${number}`, 0)

  const create = useCreateOrder()
  const createOrder = async () => {
    // create()
    if (!account || !account.address) return
    setLoading(true)
    try {
      const order = await create(
        [
          {
            itemType: ItemType.ERC20.valueOf(),
            token: tp.token,
            identifierOrCriteria: '0',
            startAmount: (parseBn(min as `${number}`) * parseBn(amount as `${number}`, 0)).toString(),
            endAmount: (parseBn(max as `${number}`) * parseBn(amount as `${number}`, 0)).toString(),
          },
        ],
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            token: tp.asset,
            identifierOrCriteria: tp.assetId?.toString() || '0',
            startAmount: parseBn(amount as `${number}`, 0).toString(),
            endAmount: parseBn(amount as `${number}`, 0).toString(),
            recipient: account.address,
          },
        ],
        _.toNumber(amount) > 1 ? 1 : 0, // Full Open
      )
      await postOrder(tp, order)
      onOpenChange && onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error(e?.toString())
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='dialog-content w-[660px]' onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogTitle>Place a bid</DialogTitle>
        <TradePairPrice tp={tp} />
        <BetaD3Chart
          minPrice={parseBn(min)}
          expectedPrice={parseBn('9')}
          maxPrice={parseBn(max)}
          defaultValue={30}
          showType='left'
        />
        <MinMax min={min} max={max} onChange={(min, max) => setMinMax([min, max])} />
        <AuthBalanceFee fee />
        <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6'>
          <div>Quantity</div>
          <InputWithButton amount={amount} setAmount={setAmount} />
          <div>{displayBalance((parseBn(max as `${number}`) * parseBn(amount as `${number}`)) / 10n ** 18n)} USDC</div>
        </div>
        <div className='flex justify-center my-4'>
          <Button disabled={loading || !enableBid} onClick={createOrder}>
            {loading && <Spinner />}
            {enableBid ? 'Bid' : 'Not enough'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
