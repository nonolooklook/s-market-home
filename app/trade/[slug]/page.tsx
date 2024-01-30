'use client'

import { CoinIcon } from '@/components/CoinIcon'
import GridTable from '@/components/GridTable'
import STable from '@/components/SimpleTable'
import { Spinner } from '@/components/Spinner'
import { BuyForList } from '@/components/modal/BuyForList'
import { ListForSale } from '@/components/modal/ListForSell'
import { PlaceBid } from '@/components/modal/PlaceBid'
import { SellForBid } from '@/components/modal/SellForBid'
import { Button } from '@/components/ui/button'
import { DollarIcon, VoiceIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useDumpBuy } from '@/lib/hooks/useDumpBuy'
import { useDumpSell } from '@/lib/hooks/useDumpSell'
import { useOrderList } from '@/lib/hooks/useOrderList'
import { useGetTradePair } from '@/lib/hooks/useTradePairs'
import { useTradePairMeta } from '@/lib/nft'
import { getOrderEP, getOrderEPbigint, getOrderPerMinMax, isSelfMaker } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { StarFilledIcon } from '@radix-ui/react-icons'
import _ from 'lodash'
import { useMemo, useRef, useState } from 'react'

function getPecentForOrder(o: OrderWrapper) {
  const max = 20
  return `${Math.round((Math.min(o.remaining_item_size, max) * 100) / max)}%`
}

function TpTrade({ tp }: { tp: TradePair }) {
  const { data = [], refetch: refetchOrderList } = useOrderList(tp)
  const [bidsdata, listdata] = useMemo(
    () => [
      _.chain(data)
        .filter((item) => item.detail.parameters.offer[0].token == tp.token)
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail)
          const bep = getOrderEPbigint(b.detail)
          return aep > bep ? 1 : aep == bep ? 0 : -1
        })
        .value(),
      _.chain(data)
        .filter((item) => item.detail.parameters.offer[0].token == tp.asset)
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail)
          const bep = getOrderEPbigint(b.detail)
          return aep > bep ? -1 : aep == bep ? 0 : 1
        })
        .value(),
    ],
    [data, tp.asset, tp.token],
  )
  const { meta } = useTradePairMeta(tp)

  const [openList, setOpenList] = useState(false)
  const [openPlaceBid, setOpenPlaceBid] = useState(false)
  const [openBuy, setOpenBuy] = useState<OrderWrapper>()
  const [openSell, setOpenSell] = useState<OrderWrapper>()
  const [buyCount, setBuyCount] = useState(0)
  const [sellCount, setSellCount] = useState(0)
  const {
    dumpBuy,
    disabledDumpBuy,
    makerOrders: buyOrders,
    loading: loadingDumpBuy,
  } = useDumpBuy(tp, listdata, buyCount)
  const {
    dumpSell,
    disabledDumpSell,
    makerOrders: sellOrders,
    loading: loadingDumpSell,
  } = useDumpSell(tp, bidsdata, sellCount)

  const bids = useMemo(() => {
    return bidsdata.map((o) => {
      const [min, max] = getOrderPerMinMax(o.detail)
      return [
        o.remaining_item_size,
        `$${max}`,
        `$${min}`,
        _.random(1, 100) + '%',
        `$${getOrderEP(o.detail)}`,
        <>
          <div className='h-full absolute bg-green-400/50 rounded-md right-0' style={{ width: getPecentForOrder(o) }} />
          {sellOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-green-400' />
          )}
        </>,
      ]
    })
  }, [bidsdata, sellOrders])
  const listing = useMemo(() => {
    return listdata.map((o) => {
      const [min, max] = getOrderPerMinMax(o.detail)
      return [
        `$${getOrderEP(o.detail)}`,
        _.random(1, 100) + '%',
        `$${min}`,
        `$${max}`,
        o.remaining_item_size,
        <>
          <div className='h-full absolute left-0 bg-red-400/50 rounded-md' style={{ width: getPecentForOrder(o) }} />
          {buyOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-red-400' />
          )}
        </>,
      ]
    })
  }, [listdata, buyOrders])

  const onDumpSell = async () => {
    try {
      await dumpSell()
      setSellCount(0)
      refetchOrderList()
    } catch (error) {}
  }
  const onDumpBuy = async () => {
    try {
      await dumpBuy()
      setBuyCount(0)
      refetchOrderList()
    } catch (error) {}
  }
  const hoverRef = useRef<{ datas: OrderWrapper[]; index: number }>({ datas: [], index: -1 })

  return (
    <main>
      <div className='flex items-center justify-between text-2xl font-medium'>
        <div className='flex items-center gap-4'>
          <img className='w-20 h-20 rounded-full' src={meta?.image} alt='nft-image' />
          {`${meta?.name} / USDC`}
          <div className='w-10 h-10 rounded-full bg-slate-100 border border-gray-200 backdrop-blur-sm flex justify-center items-center'>
            <StarFilledIcon width={20} height={20} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <CoinIcon coin='USDC' />
          {'998,992,092'}
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-5'>
        <div className=''>
          <div className='mb-5 font-medium text-xl'>Bids</div>
          <div className='border border-gray-200 rounded-2xl'>
            <GridTable
              header={['Amount', 'Max Price', 'Min Price', 'Deviation', 'Expected Price']}
              span={{}}
              data={bids}
              onClickRow={(index) => !isSelfMaker(bidsdata[index].detail) && setOpenSell(bidsdata[index])}
              rowClassName={(index) =>
                `cursor-pointer my-2 hover:bg-orange-300/30 rounded-md overflow-hidden relative ${
                  isSelfMaker(bidsdata[index].detail) ? 'text-blue-500' : ''
                } `
              }
              headerClassName='mx-5 w-[calc(100%-2.5rem)] text-center'
              tbodyClassName='max-h-[35rem] min-h-[35rem] overflow-y-auto block px-5'
              cellClassName='text-center'
            />
          </div>
          <div className='flex gap-5 flex-wrap mt-5 px-5 justify-between md:flex-nowrap'>
            <Button onClick={() => setOpenPlaceBid(true)}>
              <VoiceIcon /> Place a bid
            </Button>
            <div className='flex-1' />
            <Input
              className='w-20'
              type='number'
              step={1}
              value={sellCount}
              onChange={(e) => setSellCount(_.toSafeInteger(e.target.value))}
            />
            <Button onClick={onDumpSell} disabled={disabledDumpSell}>
              {loadingDumpSell && <Spinner />} Dump Sell
            </Button>
          </div>
        </div>
        <div>
          <div className='mb-5 font-medium text-xl'>Listing</div>
          <div className='border border-gray-200 rounded-2xl'>
            <GridTable
              header={['Expected Price', 'Deviation', 'Min Price', 'Max Price', 'Amount']}
              data={listing}
              onClickRow={(index) => !isSelfMaker(listdata[index].detail) && setOpenBuy(listdata[index])}
              rowClassName={(index) =>
                `cursor-pointer my-2 hover:bg-orange-300/30 rounded-md overflow-hidden relative ${
                  isSelfMaker(listdata[index].detail) ? 'text-blue-500' : ''
                } `
              }
              headerClassName='mx-5 w-[calc(100%-2.5rem)] text-center'
              tbodyClassName='max-h-[35rem] min-h-[35rem] overflow-y-auto block px-5'
              cellClassName='text-center'
            />
          </div>
          <div className='flex gap-5 flex-wrap mt-5 px-5  justify-between md:flex-nowrap'>
            <Button onClick={() => setOpenList(true)}>
              <DollarIcon /> List for sell
            </Button>
            <div className='flex-1' />
            <Input
              className='w-20'
              type='number'
              step={1}
              value={buyCount}
              onChange={(e) => setBuyCount(_.toSafeInteger(e.target.value))}
            />
            <Button onClick={onDumpBuy} disabled={disabledDumpBuy}>
              {loadingDumpBuy && <Spinner />} Dump Buy
            </Button>
          </div>
        </div>
      </div>
      {openList && <ListForSale open={true} onOpenChange={() => (refetchOrderList(), setOpenList(false))} tp={tp} />}
      {openPlaceBid && (
        <PlaceBid open={true} onOpenChange={() => (refetchOrderList(), setOpenPlaceBid(false))} tp={tp} />
      )}
      {openBuy && <BuyForList open={true} onOpenChange={() => setOpenBuy(undefined)} tp={tp} order={openBuy} />}
      {openSell && <SellForBid open={true} onOpenChange={() => setOpenSell(undefined)} tp={tp} order={openSell} />}
    </main>
  )
}

export default function Home({ params }: any) {
  const tp = useGetTradePair(params?.slug)
  if (!tp) return null
  return <TpTrade tp={tp} />
}
