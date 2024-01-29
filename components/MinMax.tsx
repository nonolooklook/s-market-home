
import { displayBn, parseBn } from '@/lib/utils'
import { calculateMidPriceFromBigInt } from '@/lib/price'

function checkInput(value: any) {
  if (value == undefined || value == null) return false
  try {
    parseBn(value)
  } catch (e) {
    return false
  }
  return true
}

export function MinMax({
  min,
  max,
  onChange,
  disableInput,
  maxLength = 8,
}: {
  min: `${number}`
  max: `${number}`
  maxLength?: number
  onChange?: (min: `${number}`, max: `${number}`) => void
  disableInput?: boolean
}) {
  return (
    <div className='flex justify-between'>
      <div className='px-5 h-[48px] rounded-full bg-white bg-opacity-5 flex items-center justify-center gap-1 text-sm'>
        <div>Min</div>
        <input
          disabled={disableInput}
          type='text'
          maxLength={maxLength}
          value={min}
          className={'w-[120px] bg-transparent outline-0 text-center text-xl font-semibold overflow-x-auto'}
          onChange={(e) => checkInput(e.target.value) && onChange && onChange(e.target.value.replaceAll('-', '') as `${number}`, max)}
        />
        {/* <Image src={'/usdc.svg'} alt={'usdc'} width={20} height={20} /> */}
      </div>
      <div className='w-[160px] h-[48px] rounded-full bg-white bg-opacity-5 flex items-center justify-center text-xl px-5 overflow-hidden'>
        {displayBn(calculateMidPriceFromBigInt(parseBn(min || '0'), parseBn(max || '0')))}
      </div>
      <div className='px-5 h-[48px] rounded-full bg-white bg-opacity-5 flex items-center justify-center gap-1 text-sm'>
        <div>Max</div>
        <input
          disabled={disableInput}
          type='text'
          value={max}
          maxLength={maxLength}
          className={'w-[120px] bg-transparent outline-0 text-center text-xl font-semibold overflow-x-auto'}
          onChange={(e) => checkInput(e.target.value) && onChange && onChange(min, e.target.value.replaceAll('-', '') as `${number}`)}
        />
        {/* <Image src={'/usdc.svg'} alt={'usdc'} width={20} height={20} /> */}
      </div>
    </div>
  )
}
