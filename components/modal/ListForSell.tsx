import { BetaD3Chart } from '@/components/BetaD3Chart'
import { InputWithButton } from '@/components/InputWithButton'
import { Spinner } from '@/components/Spinner'
import { FEE_ADDRESS } from '@/lib/config'
import { useAssetBalance } from '@/lib/hooks/useTokenBalance'
import { postOrder, useCreateOrder } from '@/lib/market'
import { ItemType, TradePair, assetTypeToItemType } from '@/lib/types'
import { parseBn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { MinMax } from '../MinMax'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'

export const ListForSale = ({ open, onOpenChange, tp }: DialogBaseProps & { tp: TradePair }) => {
  const { address } = useAccount()
  const [[min, max], setMinMax] = useState<[`${number}`, `${number}`]>(['8', '10'])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('1')
  //   const availableAmount = useTokenBalance({ address, token: '0x3cDa004a715C9B0B38e998E1744659b7C76288e9' })
  const { balance } = useAssetBalance(tp)
  const enabled = parseBn(amount, 0) <= balance

  const create = useCreateOrder()
  const createOrder = async () => {
    // create()

    if (!address) return
    setLoading(true)
    try {
      const amountBn = parseBn(amount as `${number}`, 0)
      const startAmount = parseBn(min as `${number}`) * amountBn
      const endAmount = parseBn(max as `${number}`) * amountBn

      const order = await create(
        [
          {
            itemType: assetTypeToItemType(tp.assetType),
            token: tp.asset,
            identifierOrCriteria: tp.assetId?.toString() || '0',
            startAmount: amountBn.toString(),
            endAmount: amountBn.toString(),
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
        amountBn > 1n ? 1 : 0, //
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
        <DialogTitle>List NFT</DialogTitle>
        <BetaD3Chart
          minPrice={parseBn(min)}
          expectedPrice={parseBn('9')}
          maxPrice={parseBn(max)}
          defaultValue={70}
          showType='right'
        />
        <MinMax min={min} max={max} onChange={(min, max) => setMinMax([min, max])} />
        <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6'>
          <div>Quantity</div>
          <InputWithButton amount={amount} setAmount={setAmount} />
          <div
            className={'cursor-pointer'}
            onClick={() => {
              setAmount(balance <= 0n ? '1' : balance.toString())
            }}
          >
            Max({balance.toString()})
          </div>
        </div>
        <AuthBalanceFee fee />
        <div className='flex justify-center my-4'>
          <Button disabled={loading || !enabled} onClick={createOrder}>
            {loading && <Spinner />}
            {'List'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
