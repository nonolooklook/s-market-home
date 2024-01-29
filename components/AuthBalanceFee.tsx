import { SimpleTip } from './Tooltip'
import { Address, useAccount } from 'wagmi'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { cn, displayBn } from '@/lib/utils'

export function AuthBalanceFee({
  auth,
  maximum,
  balance,
  fee,
  className,
  token = '0x3cDa004a715C9B0B38e998E1744659b7C76288e9',
  tokenSymbol = 'USDC',
}: {
  auth?: bigint
  maximum?: bigint
  balance?: bigint | boolean
  fee?: boolean
  className?: string
  token?: Address
  tokenSymbol?: string
}) {
  const { address } = useAccount()
  const balanceValue = useTokenBalance({ address, token })
  return (
    <div className={cn('my-1 text-gray-600 pl-4 text-lg flex flex-col items-center', className)}>
      {!!auth && (
        <div className={'text-base flex items-center gap-2'}>
          Authorization required for <span className='font-bold text-xl'>{displayBn(auth)}</span> {tokenSymbol}{' '}
          <SimpleTip content='You are required to authorize the maximum price, and any difference will be refunded if the final transaction price is less than the maximum price.' />
        </div>
      )}
      {!!maximum && (
        <div className={'text-base'}>
          Maximum price: <span className='text-xl font-bold'>{displayBn(maximum)}</span> {tokenSymbol}
        </div>
      )}
      {!!balance && (
        <div className='text-center'>
          {tokenSymbol} Balance: {displayBn(typeof balance === 'bigint' ? balance : balanceValue)}
        </div>
      )}
      {fee && <div className='text-center'>Transaction fees：0.5%</div>}
    </div>
  )
}
