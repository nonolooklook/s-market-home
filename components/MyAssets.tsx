import { MarketABI } from '@/lib/abi/MarketAbi'
import { getOrderList } from '@/lib/api'
import { MarketAddress, getCurrentExploerUrl } from '@/lib/config'
import { useTradePairs } from '@/lib/hooks/useTradePairs'
import { covert2OrderComponents } from '@/lib/market'
import { erc1155ABI } from '@/lib/nft'
import { getOrderEP, getOrderPerMinMax, getOrderPerMinMaxBigint } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { cn, displayBn, fmtBn, handleError, parseBn, shortStr, toJson } from '@/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { erc721ABI, useAccount, usePublicClient, useWalletClient } from 'wagmi'
import GridTable from './GridTable'
import { Spinner } from './Spinner'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useEffect, useState } from 'react'
import { utcFormat } from 'd3'

type GeneralProps = {
  tps: TradePair[]
}

function Inventory(p: GeneralProps) {
  const r = useRouter()
  const { address } = useAccount()
  const pc = usePublicClient()
  const { data } = useQuery({
    queryKey: [address, toJson(p.tps)],
    queryFn: async () => {
      const balance = await Promise.all(
        p.tps.map((item) =>
          pc.readContract({
            abi: item.assetType == 'ERC1155' ? erc1155ABI : erc721ABI,
            functionName: 'balanceOf',
            address: item.asset,
            args: item.assetType == 'ERC1155' ? [address, item.assetId] : [address],
          } as any),
        ),
      )
      return p.tps.map((item, i) => ({ ...item, balance: balance[i] as bigint })).filter((item) => item.balance > 0n)
    },
  })
  return (
    <div className='grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'>
      {data?.map((item, i) => {
        const isErc20 = item.assetType == 'ERC20'
        const assetDecimals = isErc20 ? 18 : 0
        return (
          <div
            key={'nft_' + i}
            style={{ border: '1px solid rgba(0, 0, 0, 0.3)' }}
            className='rounded-lg overflow-hidden flex flex-col gap-3 pb-4'
          >
            <img src={item.assetImg} className={cn('w-full aspect-video rounded-lg', isErc20 ? 'object-contain' : 'object-cover')} />
            <div className='flex flex-col gap-1 px-4 text-sm'>
              <div>{item.assetName}</div>
              <div>Amount:{displayBn(item.balance, assetDecimals > 0 ? 2 : 0, assetDecimals)}</div>
              <Button onClick={() => r.push(`/trade/${item.id}`)}>List for Sell</Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrderCancel(p: { order: OrderWrapper; onSuccess: () => void }) {
  const { data: wc } = useWalletClient()
  const pc = usePublicClient()
  const { address } = useAccount()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!wc || !address) throw 'Not connect'
      const counter = await pc.readContract({
        abi: MarketABI,
        address: MarketAddress[pc.chain.id],
        functionName: 'getCounter',
        args: [address],
      })
      const sim = await pc.simulateContract({
        abi: MarketABI,
        address: MarketAddress[pc.chain.id],
        functionName: 'cancel',
        args: [[covert2OrderComponents(p.order.detail.parameters, counter)]],
      })
      const hash = await wc.writeContract(sim.request)
      await pc.waitForTransactionReceipt({ hash, confirmations: 3 })
    },
    onError: handleError,
    onSuccess: p.onSuccess,
  })
  return <Button onClick={() => mutateAsync()}>{isPending && <Spinner />} Cancel</Button>
}

function Listed(p: GeneralProps & { bid?: boolean }) {
  const { address } = useAccount()
  const { data = [], refetch } = useQuery({
    queryKey: ['listed', address, toJson(p.tps)],
    queryFn: async () => {
      if (!address) return
      const orders = await Promise.all(
        p.tps.map((item) =>
          getOrderList({
            tradingPairId: item.id,
            offerer: address,
            nftAddress: item.asset,
            tokenAddress: item.token,
          }).then((orders) => orders.map((o) => [item, o] as [TradePair, OrderWrapper])),
        ),
      )
      return orders.flatMap((item) => item)
    },
  })
  const items = data.filter((item) => item[1].detail.parameters.offer[0].token == (p.bid ? item[0].token : item[0].asset))
  return (
    <GridTable
      header={['Order', 'Amount', 'Min', 'Expected', 'Max', '']}
      cellClassName='flex items-center'
      data={items.map(([tp, order]) => {
        // const isErc20 = tp.assetType == 'ERC20'
        // const assetDecimals = isErc20 ? 18 : 0
        const [min, max] = getOrderPerMinMax(order.detail, tp)
        const ep = getOrderEP(order.detail, tp)
        return [
          tp.assetName,
          fmtBn(parseBn(order.order_item_size)),
          `${min} ${tp.tokenSymbol}`,
          `${ep} ${tp.tokenSymbol}`,
          `${max} ${tp.tokenSymbol}`,
          <OrderCancel order={order} onSuccess={refetch} />,
        ]
      })}
    />
  )
}

const getRole = (item: any, account: string) => {
  const isMaker = item.makerOffer == account
  const isTaker = item.takerOffer == account
  if (isMaker && !isTaker) return 'Maker'
  if (isTaker && !isMaker) return 'Taker'
  return '-'
}

const getSide = (item: any, role: string) => {
  if (role == '-') return '-'
  const type = item?.fillOrderDetail?.takerOrders[0]?.parameters.offer[0]?.itemType
  const takerOfferIsUsdc = type === 1
  return role == 'Taker' ? (takerOfferIsUsdc ? 'Buy' : 'Sale') : takerOfferIsUsdc ? 'Sale' : 'Buy'
}

const getDate = (item: any) => {
  const takerOrder = item?.fillOrderDetail?.takerOrders[0]
  const time = Number(takerOrder.parameters.startTime) * 1000
  return utcFormat('%Y-%m-%d %H:%M:%S')(new Date(time))
}

function TradeHistory() {
  const { address } = useAccount()
  const history: any[] = []
  return (
    <div>
      <div className='flex flex-wrap items-center gap-2'></div>
      <GridTable
        header={['Order number', 'Date', 'Pair', 'Side', 'Price', 'Executed', 'Role', 'Min Price/Max Price', 'Fee', 'Total', 'Txn hash']}
        data={history.map((item: any) => {
          const makerOrder = item?.fillOrderDetail?.makerOrders[0]
          const count = Number(makerOrder.numerator)
          const role = getRole(item, address as any)
          const side = getSide(item, role)
          const [min, max] = getOrderPerMinMaxBigint(makerOrder as any, item as any)
          const txLink = getCurrentExploerUrl() + '/tx/' + item.txHash
          const fee = (Number(item.transaction[0].price) * 0.005 * count).toFixed(2)
          const executedPrice = Number(item.transaction[0].price).toFixed(2)
          const total = (Number(item.transaction[0].price) * count).toFixed(2)
          const tokenSymbol = 'USDC'
          return [
            shortStr(item._id), // Order number
            getDate(item), // Date
            `TimeCapsule/${tokenSymbol}`, // Pair
            <span
              key='side'
              className={cn({
                'text-green-400': side == 'Buy',
                'text-red-400': side == 'Sale',
                'text-white': side == '-',
              })}
            >
              {side}
            </span>, // Side
            `${getOrderEP(makerOrder as any, item)} ${tokenSymbol}`, // Price
            `${executedPrice} ${tokenSymbol}`, // Executed
            role, // Role
            <div className='text-right' key='minmax'>
              <div>{displayBn(min)}</div>
              <div>{displayBn(max)}</div>
            </div>, // Min Price/Max Price;
            `${fee} ${tokenSymbol}`, // Fee
            `${total} ${tokenSymbol}`, // Total
            <div className='flex items-center gap-2' key='txhash'>
              <a href={txLink} target='_blank' rel='noreferrer' className='text-yellow-400'>
                {shortStr(item.txHash, 8, 6)}
              </a>
            </div>,
          ]
        })}
      />
    </div>
  )
}

const TabValues = ['inventory', 'listed', 'bidding', 'history'] as const
type TabValueType = (typeof TabValues)[number]
export function MyAssets(p: { erc20?: boolean }) {
  const { pairs } = useTradePairs()
  const tps = pairs.filter((pair) => (p.erc20 ? pair.assetType == 'ERC20' : true))
  const sp = useSearchParams()
  const [tab, setTab] = useState<TabValueType>('inventory')
  const stab = sp.get('tab') as TabValueType
  useEffect(() => {
    if (TabValues.includes(stab)) {
      setTab(stab)
    } else {
      r.push(`?tab=${TabValues[0]}`)
    }
  }, [stab])

  const r = useRouter()
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        r.push(`?tab=${value}`)
      }}
    >
      <TabsList className='mb-5'>
        <TabsTrigger value='inventory'>Inventory</TabsTrigger>
        <TabsTrigger value='listed'>Listed</TabsTrigger>
        <TabsTrigger value='bidding'>My Bidding</TabsTrigger>
        <TabsTrigger value='history'>Trade History</TabsTrigger>
      </TabsList>
      {/* 这里放置不同的选项卡内容 */}
      <TabsContent value='inventory'>
        <Inventory tps={tps} />
      </TabsContent>
      <TabsContent value='listed'>
        <Listed tps={tps} />
      </TabsContent>
      <TabsContent value='bidding'>
        <Listed tps={tps} bid />
      </TabsContent>
      <TabsContent value='history'>
        <TradeHistory />
      </TabsContent>
    </Tabs>
  )
}
