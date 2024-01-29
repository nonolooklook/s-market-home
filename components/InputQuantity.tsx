import { InputWithButton } from './InputWithButton'

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
}: {
  amount: string
  setAmount: (amount: string) => void
  value: string
  disable?: boolean
}) {
  return (
    <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6'>
      <div>Quantity</div>
      <InputWithButton amount={amount} setAmount={setAmount} disable={disable} />
      <div>{value}</div>
    </div>
  )
}
