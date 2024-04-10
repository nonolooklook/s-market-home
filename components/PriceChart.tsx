import { DistributionItem, TradePair } from '@/lib/types'
import { CrossCircledIcon } from '@radix-ui/react-icons'
import { useMemo, useState } from 'react'
import { Button } from './ui/button'
import { useTpOrderDistribution } from '@/lib/api'
import { useTpOrderDistribution as useTpOrderDistributionSim } from '@/lib/api_simulation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { MdExpandMore } from 'react-icons/md'
const precisions = [0.01, 0.1, 1, 10, 50, 100]
const pointCount = 20

const empty: DistributionItem[] = []
export const PriceChart = ({
  tp,
  selectedPrice,
  setSelectedIsBid,
  setSelectedPrice,
  isSimulation,
}: {
  tp: TradePair
  selectedPrice?: number
  setSelectedIsBid?: (isBid: boolean) => void
  setSelectedPrice?: (price: number) => void
  isSimulation?: boolean
}) => {
  const [precision, setPrecision] = useState(0.1)
  const { data: tpDisData } = (isSimulation ? useTpOrderDistributionSim : useTpOrderDistribution)(tp, precision, pointCount)

  const lists = tpDisData?.listExpectationList || empty
  const bids = tpDisData?.bidExpectationList || empty
  const minPrice = tpDisData?.minPrice ?? 0
  const maxPrice = tpDisData?.maxPrice ?? 0
  const fix = precision >= 1 ? 0 : precision >= 0.1 ? 1 : precision >= 0.01 ? 2 : 3
  const { bidsMap, listMap } = useMemo(() => {
    const bidsMap = new Map<string, number>()
    const listMap = new Map<string, number>()
    bids.forEach((item) => {
      bidsMap.set(item.price.toFixed(fix), item.expectation)
    })
    lists.forEach((item) => {
      listMap.set(item.price.toFixed(fix), item.expectation)
    })
    return { bidsMap, listMap }
  }, [lists, bids, fix])
  const bidMaxY = useMemo(
    () => bids.reduce((max: number, cv: { expectation: number }) => (cv.expectation > max ? cv.expectation : max), 0),
    [bids],
  )
  const listMaxY = useMemo(
    () => lists.reduce((max: number, cv: { expectation: number }) => (cv.expectation > max ? cv.expectation : max), 0),
    [lists],
  )

  const maxValue = bidMaxY > listMaxY ? bidMaxY : listMaxY

  const data: any[] = useMemo(() => {
    const mdata = []
    for (let i = minPrice; i <= maxPrice; i = i + precision) {
      const key = i.toFixed(fix)
      const bp = bidsMap.get(key) ?? 0
      const lp = listMap.get(key) ?? 0
      const maxCount = 34
      mdata.push({
        price: key,
        bidAmount: Math.ceil((bp * maxCount) / maxValue),
        listAmount: Math.ceil((lp * maxCount) / maxValue),
      })
    }
    if (mdata.length < 2) return []
    return mdata
  }, [minPrice, fix, maxValue, maxPrice, bidsMap, listMap, precision])

  const step = maxValue / 5
  const values = useMemo(() => Array.from({ length: 6 }, (_, index) => Math.round(index * step * 100) / 100).reverse(), [step])
  const itemWidth = `${(100 / pointCount).toFixed(1)}%`
  return (
    <div>
      <div className={'flex mb-2'}>
        <DropdownMenu>
          <DropdownMenuTrigger className='ml-auto cursor-pointer outline-none shrink-0 text-gray-400'>
            <div className='flex items-center justify-between min-w-[90px] gap-2 px-4 py-1 border rounded-lg text-sm'>
              <span>{precision}</span>
              <MdExpandMore className='text-xl' />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='min-w-[90px]'>
            {precisions.map((item) => (
              <DropdownMenuItem
                key={'pre_' + item}
                disabled={item == precision}
                className='text-center justify-center'
                onClick={() => {
                  setSelectedPrice && setSelectedPrice(0)
                  setPrecision(item)
                }}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex items-center justify-between mb-3'>
        <Button size='sm' variant='outline' className='text-green-400 border-green-400'>
          Bid
        </Button>
        {(selectedPrice || 0) > 0 && (
          <Button size='sm' variant='secondary'>
            Price: {(selectedPrice || 0).toFixed(fix)}~{((selectedPrice || 0) + precision).toFixed(fix)}
          </Button>
        )}
        <Button size='sm' variant='outline' className='text-red-400 border-red-400'>
          Listing
        </Button>
      </div>
      <div className='flex h-[286px]'>
        <div className={'w-[36px] shrink-0 flex flex-col justify-between pb-10 text-gray-400 text-xs'}>
          {values?.map((v, i) => (
            <div key={'ylabel_' + i}>{v}</div>
          ))}
        </div>
        <div className={'grow overflow-x-auto flex flex-col pb-5'}>
          <div className='flex grow h-0'>
            {data?.map((d, i) => {
              const isSelected = selectedPrice != 0 && (selectedPrice || 0).toFixed(fix) === d.price
              return (
                <div style={{ width: itemWidth }} className='flex flex-col items-center gap-1 w-[2%] min-w-[24px] h-full' key={'data_' + i}>
                  <CrossCircledIcon
                    className={` ${isSelected ? 'visible cursor-pointer' : 'invisible'}`}
                    onClick={() => isSelected && setSelectedPrice && setSelectedPrice(0)}
                  />
                  <div
                    className={`flex-1 w-full grid grid-cols-2 px-[2px] py-1 rounded-[4px] ${isSelected ? 'bg-orange-300/30' : ''}`}
                    onClick={() => {
                      setSelectedPrice && setSelectedPrice(parseFloat(d.price))
                    }}
                  >
                    <div className={`flex gap-1 flex-col-reverse cursor-pointer`}>
                      {d.bidAmount > 0 &&
                        Array.from(Array(d.bidAmount)).map((_, i) => <div className={`h-[2px] w-ful bg-green-400`} key={'bid_' + i} />)}
                    </div>
                    <div className={'flex flex-col-reverse gap-1 cursor-pointer relative '}>
                      {d.listAmount > 0 &&
                        Array.from(Array(d.listAmount)).map((_, i) => <div className={`h-[2px] w-full bg-red-400`} key={'list_' + i} />)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className='flex mt-2 shrink-0'>
            {data?.map((d, i) => (
              <div style={{ width: itemWidth }} className={'min-w-[24px] text-center text-[10px] text-gray-400'} key={'xlabel_' + i}>
                {d.price}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
