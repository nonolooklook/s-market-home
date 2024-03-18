import { displayBn, fmtBn } from '@/lib/utils'
import React from 'react'
import { InputWithButton } from './InputWithButton'
import { Input } from './ui/input'

interface Props {
  amount: string
  setAmount: (amount: string) => void
  isErc20: boolean
  max?: bigint
  info?: string
}

export const AssetInput: React.FC<Props> = ({ amount, setAmount, isErc20, max, info }) => {
  const asseetDecimals = isErc20 ? 18 : 0
  if (isErc20) {
    return (
      <div className='w-full flex flex-col gap-4'>
        <div>Quantity</div>
        <Input pattern='[0-9.]*' value={amount} onChange={(e) => setAmount(e.target.value.replaceAll('-', ''))} />
        {max != undefined && (
          <div
            className={'cursor-pointer w-fit'}
            onClick={() => {
              setAmount(max <= 0n ? '1' : fmtBn(max, asseetDecimals))
            }}
          >
            Max({displayBn(max, asseetDecimals > 0 ? 2 : 0, asseetDecimals)})
          </div>
        )}
        {!!info && <div>{info}</div>}
      </div>
    )
  } else {
    return (
      <div className='flex text-2xl font-light bg-white bg-opacity-5 rounded-2xl h-[64px] justify-between flex items-center px-6'>
        <div>Quantity</div>
        <InputWithButton amount={amount} setAmount={setAmount} />
        {max != undefined && (
          <div
            className={'cursor-pointer w-fit'}
            onClick={() => {
              setAmount(max <= 0n ? '1' : fmtBn(max, asseetDecimals))
            }}
          >
            Max({displayBn(max, asseetDecimals > 0 ? 2 : 0, asseetDecimals)})
          </div>
        )}
        {!!info && <div>{info}</div>}
      </div>
    )
  }
}

export default AssetInput
