'use client'
import GridTable from '@/components/GridTable'
import { PriceChart } from '@/components/PriceChart'
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
import { getOrderEP, getOrderEPbigint, getOrderPerMinMax, getOrderPerMinMaxBigint, isSelfMaker } from '@/lib/order'
import { Data, OrderWrapper, TradePair } from '@/lib/types'
import { dealUrl, parseBn } from '@/lib/utils'
import { DiscordIcon } from '@/public/Discord'
import { TwitterIcon } from '@/public/Twitter'
import { StarFilledIcon } from '@radix-ui/react-icons'
import _ from 'lodash'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNetwork } from 'wagmi'

function getPecentForOrder(o: OrderWrapper) {
  const max = 20
  return `${Math.round((Math.min(o.remaining_item_size, max) * 100) / max)}%`
}

function TpTrade({ tp }: { tp: TradePair }) {
  const { data = [], refetch: refetchOrderList } = useOrderList(tp)
  const [selectPrice, setSelectPrice] = useState<number>(0)
  const net = useNetwork()
  const url = net.chain?.blockExplorers?.default?.url || 'https://sepolia.arbiscan.io/'
  const [bidsdata, listdata] = useMemo(
    () => [
      _.chain(data)
        .filter((item) => {
          let [min, max] = [0n, 0n]
          const priceBn = parseBn('' + selectPrice)
          const isFilterForPrice =
            selectPrice <= 0 || (([min, max] = getOrderPerMinMaxBigint(item.detail)) && min < priceBn && max > priceBn)
          return item.detail.parameters.offer[0].token == tp.token && isFilterForPrice
        })
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail)
          const bep = getOrderEPbigint(b.detail)
          return aep > bep ? 1 : aep == bep ? 0 : -1
        })
        .value(),
      _.chain(data)
        .filter((item) => {
          let [min, max] = [0n, 0n]
          const priceBn = parseBn('' + selectPrice)
          const isFilterForPrice =
            selectPrice <= 0 || (([min, max] = getOrderPerMinMaxBigint(item.detail)) && min < priceBn && max > priceBn)
          return item.detail.parameters.offer[0].token == tp.asset && isFilterForPrice
        })
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail)
          const bep = getOrderEPbigint(b.detail)
          return aep > bep ? -1 : aep == bep ? 0 : 1
        })
        .value(),
    ],
    [data, tp.asset, tp.token, selectPrice],
  )
  const { meta } = useTradePairMeta(tp)
  const [openList, setOpenList] = useState(false)
  const [openPlaceBid, setOpenPlaceBid] = useState(false)
  const [openBuy, setOpenBuy] = useState<OrderWrapper>()
  const [openSell, setOpenSell] = useState<OrderWrapper>()
  const [buyCount, setBuyCount] = useState(0)
  const [sellCount, setSellCount] = useState(0)
  const [info, setInfo] = useState<Data>()
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
      let num = ((Number(max) - Number(min)) / (Number(max) + Number(min))) * 100
      let Deviation = parseInt(num.toFixed(0)) + '%'
      return [
        o.remaining_item_size,
        `$${max}`,
        `$${min}`,
        Deviation,
        `$${getOrderEP(o.detail)}`,
        <Fragment key={'bid_info_' + o.id}>
          <div className='h-full absolute bg-green-400/50 rounded-md right-0' style={{ width: getPecentForOrder(o) }} />
          {sellOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-green-400' />
          )}
        </Fragment>,
      ]
    })
  }, [bidsdata, sellOrders])
  const listing = useMemo(() => {
    return listdata.map((o) => {
      const [min, max] = getOrderPerMinMax(o.detail)
      let num = ((Number(max) - Number(min)) / (Number(max) + Number(min))) * 100
      let Deviation = parseInt(num.toFixed(0)) + '%'

      return [
        `$${getOrderEP(o.detail)}`,
        `$${min}`,
        `$${max}`,
        Deviation,
        o.remaining_item_size,
        <Fragment key={'list_info_' + o.id}>
          <div className='h-full absolute left-0 bg-red-400/50 rounded-md' style={{ width: getPecentForOrder(o) }} />
          {buyOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-red-400' />
          )}
        </Fragment>,
      ]
    })
  }, [listdata, buyOrders])

  useEffect(() => {
    const getInfo = async () => {
      fetch('https://sme-demo.mcglobal.ai/smev2/common/order/tradingPair/1/collection/detail')
        .then((res) => res.json())
        .then(({ data = {} }) => {
          if (data) {
            setInfo(data)
          }
        })
        .catch((err) => console.log('fetch error:', err))
    }
    getInfo()
  }, [])

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

  const dealTrailingZeros = (value?: string): string => {
    if (!value) return ''
    return value?.replace(/0+$/, '')
  }

  const totalVolume48: number = Number(dealTrailingZeros(info?.volume48))
  const totalVolume24: number = Number(dealTrailingZeros(info?.volume24))

  const volumeChange24: number = totalVolume24 - totalVolume48

  const volumeChangePercentage24: number | string = (volumeChange24 / totalVolume48) * 100

  const dealPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const PriceData = [
    { title: 'Floor Price', price: `${dealPrice(Number(info?.floorPrice))}` },
    { title: 'Top Bid', price: `${dealPrice(Number(info?.topBid))}` },
    { title: '24H Change', price: totalVolume24 === 0 ? '-' : volumeChangePercentage24.toFixed(2) + '%' },
    { title: '24H Volume', price: `${dealPrice(Number(info?.volume24))}` },
    { title: 'Supply', price: `$${info?.collectionDetail.base_info?.total_supply}` },
  ]

  const onClickOrHover = (type: boolean, i: number) => {
    if (!type) {
      !isSelfMaker(listdata[i].detail) && setOpenBuy(listdata[i])
    }
  }

  const copyTextToClipboard = () => {
    navigator.clipboard
      .writeText(info?.collectionDetail.contract_address as string)
      .then(() => {
        toast.success('Copy successfully!')
      })
      .catch((error) => {
        console.error('Unable to copy text to clipboard:', error)
      })
  }

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
        {PriceData.map((item, index) => {
          return (
            <div key={`price_${index}`}>
              <div className='text-base font-normal'>{item.title}</div>
              <div className='text-xl font-medium mt-[27px] text-center'>{item.price}</div>
            </div>
          )
        })}
        <div className=' h-[87px] bg-[#FBF7F7] flex items-center px-2'>
          <img className='w-20 h-20 rounded-full' src={info?.collectionDetail.base_info.image_url} alt='nft-image' />
          <div className=' ml-5'>
            <div className='flex items-center'>
              <span className=' mr-2'>{info?.collectionDetail.base_info.name}</span>
              <img src='/start.svg' />
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <button onClick={copyTextToClipboard}>
                <img src='/copy.svg' />
              </button>
              <Link target={'_blank'} href={`https://twitter.com/${info?.collectionDetail.base_info.twitter_username}`}>
                <TwitterIcon />
              </Link>
              <Link target={'_blank'} href={`${info?.collectionDetail.base_info.discord_url}`}>
                <DiscordIcon />
              </Link>
              <Link target={'_blank'} href={`${info?.collectionDetail.base_info.project_url}`}>
                <img src='/earth.svg' />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-[10px] '>
        <button
          onClick={() => window.open(dealUrl(url) + 'address/' + info?.collectionDetail.contract_address)}
          className='flex justify-center items-center gap-2  rounded-[8px] border bg-[#1A1A1A] text-white w-[142px] h-10 text-lg font-light'
        >
          History
        </button>
      </div>
      <div className='grid md:grid-cols-2 gap-5'>
        <div className=''>
          <div className='mb-5 font-medium text-xl'>Bids</div>
          <div className='border border-gray-200 rounded-2xl'>
            <GridTable
              keyS={'bid'}
              header={['Amount', 'Max Price', 'Min Price', 'Deviation', 'Expected Price']}
              data={bids}
              list={bidsdata}
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
              keyS={'list'}
              header={['Expected Price', 'Min Price', 'Max Price', 'Deviation', 'Amount']}
              data={listing}
              list={listdata}
              onClickRow={(index) => {
                onClickOrHover(false, index)
              }}
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
      <div className='py-4 mb-6'>
        <PriceChart tp={tp} selectedPrice={selectPrice} setSelectedPrice={setSelectPrice} />
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
