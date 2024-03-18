import { DECIMAL18 } from '@/lib/config'
import { MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { parseEther, formatEther } from 'viem'

export const InputWithButton = ({
  amount,
  setAmount,
  disable,
}: {
  amount: string
  setAmount: any
  disable?: boolean
}) => {
  const amountBn = parseEther(amount as `${number}`)
  return (
    <div className='flex items-center gap-2 select-none'>
      <div
        className={
          'w-[46px] h-[46px] flex items-center justify-center border border-gray-400 border-dotted rounded-full cursor-pointer'
        }
        onClick={() => {
          if (!disable && parseEther(amount as `${number}`) > DECIMAL18) {
            setAmount(formatEther(amountBn - DECIMAL18))
          }
        }}
      >
        <MinusIcon />
      </div>

      <input
        className={'w-[80px] bg-transparent outline-0 text-center text-3xl font-semibold'}
        type='text'
        value={amount}
        disabled={disable}
        pattern='[0-9]*'
        onChange={(e) => setAmount(e.target.value?.replaceAll('-', ''))}
      />

      <div
        className={
          'w-[46px] h-[46px] flex items-center justify-center border border-gray-400 border-dotted rounded-full cursor-pointer'
        }
        onClick={() => !disable && setAmount(formatEther(amountBn + DECIMAL18))}
      >
        <PlusIcon />
      </div>
    </div>
  )
}
