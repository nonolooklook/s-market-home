'use client'
import GridTable from '@/components/GridTable'
import { PriceChart } from '@/components/PriceChart'
import { RequestCoins } from '@/components/RequestCoins'
import { RowTip } from '@/components/RowTooltip'
import { Spinner } from '@/components/Spinner'
import { TpBalance } from '@/components/TpBalance'
import { TxStatus } from '@/components/TxStatus'
import { BuyForList } from '@/components/modal_simulation/BuyForList'
import HoverModalList from '@/components/modal_simulation/HoverModalList'
import { ListForSale } from '@/components/modal_simulation/ListForSell'
import { PlaceBid } from '@/components/modal_simulation/PlaceBid'
import { SellForBid } from '@/components/modal_simulation/SellForBid'
import { Button } from '@/components/ui/button'
import { DollarIcon, VoiceIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useOrderList, useTradePairDetail } from '@/lib/api_simulation'
import { useDumpBuy } from '@/lib/hooks/useDumpBuy'
import { useDumpSell } from '@/lib/hooks/useDumpSell'
import { useGetTradePair } from '@/lib/hooks/useTradePairs'
import { getOrderEP, getOrderEPbigint, getOrderPerMinMax, getOrderPerMinMaxBigint, isSelfMaker } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { dealUrl, fmtBn, parseBn } from '@/lib/utils'
import { DiscordIcon } from '@/public/Discord'
import { TwitterIcon } from '@/public/Twitter'
import { StarFilledIcon } from '@radix-ui/react-icons'
import _ from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useNetwork } from 'wagmi'

function getPecentForOrder(o: OrderWrapper) {
  const max = 20
  const remainSize = _.toNumber(o.remaining_item_size)
  return `${Math.round((Math.min(remainSize, max) * 100) / max)}%`
}

function TpTrade({ tp }: { tp: TradePair }) {
  const r = useRouter()
  const { data = [], refetch: refetchOrderList } = useOrderList(tp)
  const { data: info } = useTradePairDetail(tp.id)
  const isErc20 = tp.assetType == 'ERC20'
  const isErc721 = tp.assetType == 'ERC721'
  const isErc1155 = tp.assetType == 'ERC1155'
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
            selectPrice <= 0 ||
            (([min, max] = getOrderPerMinMaxBigint(item.detail, tp)) && min < priceBn && max > priceBn)
          return item.detail.parameters.offer[0].token == tp.token && isFilterForPrice
        })
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail, tp)
          const bep = getOrderEPbigint(b.detail, tp)
          return aep > bep ? 1 : aep == bep ? 0 : -1
        })
        .value(),
      _.chain(data)
        .filter((item) => {
          let [min, max] = [0n, 0n]
          const priceBn = parseBn('' + selectPrice)
          const isFilterForPrice =
            selectPrice <= 0 ||
            (([min, max] = getOrderPerMinMaxBigint(item.detail, tp)) && min < priceBn && max > priceBn)
          return item.detail.parameters.offer[0].token == tp.asset && isFilterForPrice
        })
        .sort((a, b) => {
          const aep = getOrderEPbigint(a.detail, tp)
          const bep = getOrderEPbigint(b.detail, tp)
          return aep > bep ? -1 : aep == bep ? 0 : 1
        })
        .value(),
    ],
    [data, tp.asset, tp.token, selectPrice],
  )
  // const { meta } = useTradePairMeta(tp)
  const [openList, setOpenList] = useState(false)
  const [openPlaceBid, setOpenPlaceBid] = useState(false)
  const [openBuy, setOpenBuy] = useState<OrderWrapper>()
  const [openSell, setOpenSell] = useState<OrderWrapper>()
  const [buyCount, setBuyCount] = useState(0)
  const [sellCount, setSellCount] = useState(0)
  const tpBalanceRef = useRef<() => void>(null)
  const onSuccessDumpBuy = () => {
    setBuyCount(0)
    refetchOrderList()
    tpBalanceRef.current?.()
  }
  const {
    dumpBuy,
    disabledDumpBuy,
    makerOrders: buyOrders,
    loading: loadingDumpBuy,
    txs: buyTxs,
  } = useDumpBuy(tp, listdata, buyCount, onSuccessDumpBuy, true)
  const onSuccessDumpSell = () => {
    setSellCount(0)
    refetchOrderList()
    tpBalanceRef.current?.()
  }
  const {
    dumpSell,
    disabledDumpSell,
    makerOrders: sellOrders,
    loading: loadingDumpSell,
    txs: sellTxs,
  } = useDumpSell(tp, bidsdata, sellCount, onSuccessDumpSell, true)

  const bids = useMemo(() => {
    return bidsdata.map((o) => {
      const [min, max] = getOrderPerMinMax(o.detail, tp)
      let num = ((Number(max) - Number(min)) / (Number(max) + Number(min))) * 100
      let Deviation = parseInt(num.toFixed(0)) + '%'

      return [
        fmtBn(parseBn(o.remaining_item_size)),
        `$${max}`,
        `$${min}`,
        Deviation,
        `$${getOrderEP(o.detail, tp)}`,
        <Fragment key={'bid_info_' + o.id}>
          <div className='h-full absolute bg-green-400/50 rounded-md right-0' style={{ width: getPecentForOrder(o) }} />
          {sellOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-green-400' />
          )}
          <RowTip
            trigger={<div className='h-full absolute left-0 w-full' />}
            content={<HoverModalList order={o} tp={tp} />}
          />
        </Fragment>,
      ]
    })
  }, [bidsdata, sellOrders])
  const listing = useMemo(() => {
    return listdata.map((o) => {
      const [min, max] = getOrderPerMinMax(o.detail, tp)
      let num = ((Number(max) - Number(min)) / (Number(max) + Number(min))) * 100
      let Deviation = parseInt(num.toFixed(0)) + '%'
      return [
        `$${getOrderEP(o.detail, tp)}`,
        Deviation,
        `$${min}`,
        `$${max}`,
        fmtBn(parseBn(o.remaining_item_size)),
        <Fragment key={'list_info_' + o.id}>
          <div className='h-full absolute left-0 bg-red-400/50 rounded-md' style={{ width: getPecentForOrder(o) }} />
          {buyOrders.find((item) => item.id == o.id) && (
            <div className='h-full absolute left-0 w-full bg-stone-400/30 rounded-md border border-solid border-red-400' />
          )}
          <RowTip
            trigger={<div className='h-full absolute left-0 w-full' />}
            content={<HoverModalList order={o} tp={tp} />}
          />
        </Fragment>,
      ]
    })
  }, [listdata, buyOrders])
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
    {
      title: isErc20 ? 'Price' : 'Floor Price',
      price: `${dealPrice(Number(info?.floorPrice || '0'))}`,
    },
    info?.topBid ? { title: 'Top Bid', price: `${dealPrice(Number(info?.topBid))}` } : null,
    {
      title: '24H Change',
      price: totalVolume24 === 0 || totalVolume48 === 0 ? '-' : volumeChangePercentage24.toFixed(2) + '%',
    },
    { title: '24H Volume', price: `${dealPrice(Number(info?.volume24))}` },
    isErc20
      ? { title: 'Market Cap', price: `$${info?.collectionDetail?.trading_info?.marketCap?.toFixed() || '-'}` }
      : { title: 'Supply', price: `${info?.collectionDetail?.base_info?.total_supply || '-'}` },
  ]

  const onClickOrHover = (type: boolean, i: number) => {
    if (!type) {
      !isSelfMaker(listdata[i].detail) && setOpenBuy(listdata[i])
    }
  }

  const copyTextToClipboard = () => {
    navigator.clipboard
      .writeText(info?.collectionDetail?.contract_address as string)
      .then(() => {
        toast.success('Copy successfully!')
      })
      .catch((error) => {
        console.error('Unable to copy text to clipboard:', error)
      })
  }
  const assetImg = tp.assetImg
  const assetName = tp.assetName
  const assetTwitter = info?.collectionDetail?.base_info?.twitter_username || ''
  const assetDiscord = info?.collectionDetail?.base_info?.discord_url || ''
  const assetProject = info?.collectionDetail?.base_info?.project_url || ''

  return (
    <main>
      <div className='flex items-center justify-between text-2xl font-medium'>
        <div className='flex items-center gap-4'>
          <img className='w-20 h-20 rounded-full bg-amber-50' src={assetImg} alt='nft-image' />
          {`${assetName} / ${info?.tokenDetail?.name}`}
          <div className='w-10 h-10 rounded-full bg-slate-100 border border-gray-200 backdrop-blur-sm flex justify-center items-center'>
            <StarFilledIcon width={20} height={20} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
          </div>
        </div>
        {PriceData.map((item, index) => {
          if (!item) return null
          return (
            <div key={`price_${index}`}>
              <div className='text-base font-normal'>{item.title}</div>
              <div className='text-xl font-medium mt-[27px] text-center'>{item.price}</div>
            </div>
          )
        })}
        <div className=' h-[87px] bg-[#FBF7F7] flex items-center px-2'>
          <img className='w-20 h-20 rounded-full' src={assetImg} alt='nft-image' />
          <div className=' ml-5'>
            <div className='flex items-center'>
              <span className=' mr-2'>{assetName}</span>
              <img src='/start.svg' />
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <button onClick={copyTextToClipboard}>
                <img src='/copy.svg' />
              </button>
              {assetTwitter && (
                <Link target={'_blank'} href={`https://twitter.com/${assetTwitter}`}>
                  <TwitterIcon />
                </Link>
              )}
              {assetDiscord && (
                <Link target={'_blank'} href={assetDiscord}>
                  <DiscordIcon />
                </Link>
              )}
              {assetProject && (
                <Link target={'_blank'} href={assetProject}>
                  <img src='/earth.svg' />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-[10px] items-center'>
        <TpBalance tp={tp} isSimulation ref={tpBalanceRef} />
        <Button onClick={() => r.push(`/trade/${tp.id}`)}>Real</Button>
        <RequestCoins tp={tp} onSuccess={() => tpBalanceRef.current?.()} />
        {/* <Button onClick={() => window.open(dealUrl(url) + 'address/' + info?.collectionDetail?.contract_address)}>
          History
        </Button> */}
      </div>
      <div className='grid md:grid-cols-2 gap-5'>
        <div className=''>
          <div className='mb-5 font-medium text-xl'>Bids</div>
          <div className='border border-gray-200 rounded-2xl'>
            <GridTable
              keyS={'bid'}
              header={['Amount', 'Max Price', 'Min Price', 'Deviation', 'Expected Price']}
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
              onChange={(e) => setSellCount(isErc20 ? _.toNumber(e.target.value) : _.toSafeInteger(e.target.value))}
            />
            <Button onClick={dumpSell} disabled={disabledDumpSell}>
              {loadingDumpSell && <Spinner />} Dump Sell
            </Button>
          </div>
        </div>
        <div>
          <div className='mb-5 font-medium text-xl'>Listing</div>
          <div className='border border-gray-200 rounded-2xl'>
            <GridTable
              keyS={'list'}
              header={['Expected Price', 'Deviation', 'Min Price', 'Max Price', 'Amount']}
              data={listing}
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
              onChange={(e) => setBuyCount(isErc20 ? _.toNumber(e.target.value) : _.toSafeInteger(e.target.value))}
            />
            <Button onClick={dumpBuy} disabled={disabledDumpBuy}>
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
      {openBuy && (
        <BuyForList
          open={true}
          onOpenChange={() => setOpenBuy(undefined)}
          tp={tp}
          order={openBuy}
          onSuccess={() => (refetchOrderList(), tpBalanceRef.current?.())}
        />
      )}
      {openSell && (
        <SellForBid
          open={true}
          onOpenChange={() => setOpenSell(undefined)}
          tp={tp}
          order={openSell}
          onSuccess={() => (refetchOrderList(), tpBalanceRef.current?.())}
        />
      )}
      {(buyTxs.txsOpen || sellTxs.txsOpen) && <TxStatus {...(buyTxs.txsOpen ? buyTxs.txsProps : sellTxs.txsProps)} />}
    </main>
  )
}

export default function Home({ params }: any) {
  const slug: string = params?.slug || ''
  const tp = useGetTradePair(slug)
  if (!tp) return null
  return <TpTrade tp={tp} />
}
