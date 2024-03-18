import { InputWithButton } from './InputWithButton'
import { Input } from './ui/input'

export function InputQuantity({
  amount,
  setAmount,
  max,
  disable,
}: {
  amount: string
  setAmount: (amount: string) => void
  max: number
  disable?: boolean
}) {
  return (
    <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6 mt-6'>
      <div>Quantity</div>
      <InputWithButton amount={amount} setAmount={setAmount} disable={disable} />
      <div
        className={'cursor-pointer'}
        onClick={() => {
          !disable && setAmount(max <= 0 ? '0' : max.toFixed())
        }}
      >
        Max({max})
      </div>
    </div>
  )
}

export function InputQuantityValue({
  amount,
  setAmount,
  value,
  disable,
  isErc20,
}: {
  amount: string
  setAmount: (amount: string) => void
  value: string
  disable?: boolean
  isErc20?: boolean
}) {
  if (isErc20) {
    return (
      <div className='w-full flex flex-col gap-4'>
        <div>Quantity</div>
        <Input
          pattern='[0-9.]*'
          value={amount}
          disabled={disable}
          onChange={(e) => setAmount(e.target.value.replaceAll('-', ''))}
        />
        <div>{value}</div>
      </div>
    )
  }
  return (
    <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6'>
      <div>Quantity</div>
      <InputWithButton amount={amount} setAmount={setAmount} disable={disable} />
      <div>{value}</div>
    </div>
  )
}
