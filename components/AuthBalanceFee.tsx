import { cn, displayBn } from '@/lib/utils'
import { SimpleTip } from './Tooltip'

export function AuthBalanceFee({
  auth,
  maximum,
  balance,
  fee,
  className,
  tokenSymbol = 'USDC',
}: {
  auth?: bigint
  maximum?: bigint
  balance?: bigint
  fee?: boolean
  className?: string
  tokenSymbol?: string
}) {
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
      {typeof balance == 'bigint' && (
        <div className='text-center'>
          {tokenSymbol} Balance: {displayBn(balance)}
        </div>
      )}
      {fee && <div className='text-center'>Transaction fees：0.5%</div>}
    </div>
  )
}
