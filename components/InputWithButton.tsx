import { MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { parseUnits } from 'viem'

export const InputWithButton = ({ amount, setAmount, disable }: { amount: string; setAmount: any; disable?: boolean }) => {
  return (
    <div className='flex items-center gap-2 select-none'>
      <div
        className={'w-[46px] h-[46px] flex items-center justify-center border border-gray-400 border-dotted rounded-full cursor-pointer'}
        onClick={() => {
          if (!disable && parseUnits(amount as `${number}`, 0) > 1n) {
            setAmount((Number(amount) - 1).toString())
          }
        }}
      >
        <MinusIcon />
      </div>

      <input
        type='text'
        value={amount}
        disabled={disable}
        className={'w-[80px] bg-transparent outline-0 text-center text-3xl font-semibold'}
        onChange={(e) => setAmount(e.target.value?.replaceAll('-',''))}
      />

      <div
        className={'w-[46px] h-[46px] flex items-center justify-center border border-gray-400 border-dotted rounded-full cursor-pointer'}
        onClick={() => !disable && setAmount((Number(amount) + 1).toString())}
      >
        <PlusIcon />
      </div>
    </div>
  )
}
