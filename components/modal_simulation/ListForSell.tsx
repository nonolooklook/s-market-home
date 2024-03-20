import { BetaD3Chart } from '@/components/BetaD3Chart'
import { Spinner } from '@/components/Spinner'
import { FEE_ADDRESS } from '@/lib/config'
import { createOrder } from '@/lib/market_simulation'
import { ItemType, TradePair, assetTypeToItemType } from '@/lib/types'
import { handleError, parseBn } from '@/lib/utils'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import AssetInput from '../AssetInput'
import { AuthBalanceFee } from '../AuthBalanceFee'
import { MinMax } from '../MinMax'
import { useTpBalance } from '../TpBalance'
import { Button } from '../ui/button'
import { Dialog, DialogBaseProps, DialogContent, DialogTitle } from '../ui/dialog'
import { postOrder } from '@/lib/api_simulation'
import { useClients } from '@/lib/market'

export const ListForSale = ({ open, onOpenChange, tp }: DialogBaseProps & { tp: TradePair }) => {
  const isErc20 = tp.assetType === 'ERC20'
  const asseetDecimals = isErc20 ? 18 : 0
  const { address } = useAccount()
  const [[min, max], setMinMax] = useState<[`${number}`, `${number}`]>(['8', '10'])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('1')
  const { data: [balance] = [0n, 0n] } = useTpBalance(tp, true)
  const enabled = parseBn(amount, asseetDecimals) <= balance
  const clients = useClients()
  const onClick = async () => {
    if (!address) return
    setLoading(true)
    try {
      const amountBn = parseBn(amount as `${number}`, asseetDecimals)
      const startAmount = (parseBn(min as `${number}`) * amountBn) / 10n ** BigInt(asseetDecimals)
      const endAmount = (parseBn(max as `${number}`) * amountBn) / 10n ** BigInt(asseetDecimals)

      const order = await createOrder(
        clients,
        address,
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
        isErc20 || amountBn > 1n ? 1 : 0, //
      )
      await postOrder(tp, order)
      onOpenChange && onOpenChange(false)
    } catch (e) {
      handleError(e)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='dialog-content w-[660px]' onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogTitle>List {tp.assetType == 'ERC20' ? 'Token' : 'NFT'}</DialogTitle>
        <BetaD3Chart
          minPrice={parseBn(min)}
          expectedPrice={parseBn('9')}
          maxPrice={parseBn(max)}
          defaultValue={70}
          showType='right'
        />
        <MinMax min={min} max={max} onChange={(min, max) => setMinMax([min, max])} />
        <AssetInput isErc20={isErc20} amount={amount} setAmount={setAmount} max={balance} />
        <AuthBalanceFee fee />
        <div className='flex justify-center my-4'>
          <Button disabled={loading || !enabled} onClick={onClick}>
            {loading && <Spinner />}
            {'List'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
