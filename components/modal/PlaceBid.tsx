import { BetaD3Chart } from '@/components/BetaD3Chart'
import { Spinner } from '@/components/Spinner'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { postOrder, useCreateOrder } from '@/lib/market'
import { ItemType, TradePair, assetTypeToItemType } from '@/lib/types'
import { displayBn, parseBn } from '@/lib/utils'
import _ from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import AssetInput from '../AssetInput'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { MinMax } from '../MinMax'
import { TradePairPrice } from '../TradePairPrice'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'

export const PlaceBid = ({
  open,
  onOpenChange,
  tp,
}: DialogBaseProps & {
  tp: TradePair
}) => {
  const isErc20 = tp.assetType === 'ERC20'
  const asseetDecimals = isErc20 ? 18 : 0
  const [[min, max], setMinMax] = useState<[`${number}`, `${number}`]>(['8', '10'])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('1')
  const amountBn = parseBn(amount, asseetDecimals)
  const account = useAccount()
  const balance = useTokenBalance({ address: account?.address, token: tp.token })
  const enableBid = balance >= parseBn(max as `${number}`) * parseBn(amount as `${number}`, 0)

  const create = useCreateOrder()
  const createOrder = async () => {
    // create()
    if (!account || !account.address) return
    setLoading(true)
    const asseetDecimals = isErc20 ? 18 : 0
    const tokenStart = (parseBn(min as `${number}`) * amountBn) / 10n ** BigInt(asseetDecimals)
    const tokenEnd = (parseBn(max as `${number}`) * amountBn) / 10n ** BigInt(asseetDecimals)
    try {
      const order = await create(
        [
          {
            itemType: ItemType.ERC20.valueOf(),
            token: tp.token,
            identifierOrCriteria: '0',
            startAmount: tokenStart.toString(),
            endAmount: tokenEnd.toString(),
          },
        ],
        [
          {
            itemType: assetTypeToItemType(tp.assetType, true),
            token: tp.asset,
            identifierOrCriteria: tp.assetId?.toString() || '0',
            startAmount: amountBn.toString(),
            endAmount: amountBn.toString(),
            recipient: account.address,
          },
        ],
        isErc20 || _.toNumber(amount) > 1 ? 1 : 0, // Full Open
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
        <AssetInput
          isErc20={isErc20}
          amount={amount}
          setAmount={setAmount}
          info={`${displayBn(parseBn(max) * amountBn, 2, 18 + asseetDecimals)} ${tp.tokenSymbol}`}
        />
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
