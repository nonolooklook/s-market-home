import { useEffect } from 'react'

export const PriceInput = ({
  title,
  value,
  setValue,
  minimum,
  maximum,
  wrong,
}: {
  title: string
  value: string
  setValue: any
  minimum: string
  maximum: string
  wrong: boolean
}) => {
  // const isWrong = value < minimum || value > maximum;

  return (
    <div
      className={`${
        wrong ? 'border-red-400' : 'border-primary'
      } border rounded-[12px] p-4 text-xs flex flex-col gap-4 items-center cursor-pointer`}
    >
      <div className={'text-primary'}>{title}</div>
      <div className={'flex justify-between items-center gap-4 w-full'}>
        <div
          className={'rounded-[8px] bg-primary bg-opacity-20 w-[26px] h-[26px] flex items-center justify-center text-[30px] cursor-pointer'}
          onClick={() => setValue((Number(value) - 0.01).toFixed(2))}
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M2.25 7.5C2.25 7.22386 2.47386 7 2.75 7H12.25C12.5261 7 12.75 7.22386 12.75 7.5C12.75 7.77614 12.5261 8 12.25 8H2.75C2.47386 8 2.25 7.77614 2.25 7.5Z'
              fill='currentColor'
              fillRule='evenodd'
              clipRule='evenodd'
            ></path>
          </svg>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type='text'
          className={'border-none outline-0 text-[24px] text-center w-0 flex-1'}
          style={{ background: 'none' }}
          placeholder={'0.00'}
        />
        <div
          className={'rounded-[8px] bg-primary bg-opacity-20 w-[26px] h-[26px] flex items-center justify-center text-[30px] cursor-pointer'}
          onClick={() => setValue((Number(value) + 0.01).toFixed(2))}
        >
          <svg width='16' height='16' viewBox='0 0 15 15' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z'
              fill='currentColor'
              fillRule='evenodd'
              clipRule='evenodd'
            ></path>
          </svg>
        </div>
      </div>
      <div className={'text-primary'}>USDT</div>
    </div>
  )
}
