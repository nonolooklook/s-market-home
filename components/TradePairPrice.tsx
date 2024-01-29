import { TradePair } from '@/lib/types'

export function TradePairPrice({ tp }: { tp: TradePair }) {
  return (
    <div className='flex bg-[#F2F2F2] rounded-xl px-8 py-4 gap-4'>
      <img src={'/capsule-1.png'} alt={'capsule'} width={46} height={70} />
      <div className={'w-full'}>
        <div className={'text-lg font-light flex items-center justify-between mb-1'}>
          Schrödinger`s time capsules
          <div className='flex text-2xl font-semibold ml-auto gap-1'>
            {/* <Image src={'/usdc.svg'} alt={'usdc'} width={28} height={28} /> */}
            {'$ '}
            {"9.8"}
          </div>
        </div>
        <div className={'text-lg font-light flex items-center justify-between'}>
          Stochastic Universe
          <div>Market price</div>
        </div>
      </div>
    </div>
  )
}
