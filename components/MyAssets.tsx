import { MarketABI } from '@/lib/abi/MarketAbi'
import { getOrderList, getTradeHistory } from '@/lib/api'
import { DECIMAL18, MarketAddress, getCurrentExploerUrl } from '@/lib/config'
import { useSyncSearchParams } from '@/lib/hooks/useSyncSearchParams'
import { useTradePairs } from '@/lib/hooks/useTradePairs'
import { covert2OrderComponents } from '@/lib/market'
import { erc1155ABI } from '@/lib/nft'
import { getOrderAssetInfo, getOrderEP, getOrderPerMinMax, getOrderPerMinMaxBigint } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { cn, displayBn, fmtBn, handleError, parseBn, shortStr, toJson } from '@/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { utcFormat } from 'd3'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { erc721ABI, useAccount, usePublicClient, useWalletClient } from 'wagmi'
import GridTable from './GridTable'
import { Loading } from './Loading'
import STable from './SimpleTable'
import { Spinner } from './Spinner'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type GeneralProps = {
  tps: TradePair[]
}

function Inventory(p: GeneralProps) {
  const r = useRouter()
  const { address } = useAccount()
  const pc = usePublicClient()
  const { data, isLoading } = useQuery({
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
  if (isLoading) return <Loading />
  if (!p.tps.length) return null
  const isERC20 = p.tps[0].assetType == 'ERC20'
  const assetDecimals = isERC20 ? 18 : 0
  return (
    <div
      className={cn(
        'grid gap-2',
        isERC20 ? 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
      )}
    >
      {data?.map((item, i) => {
        return (
          <div
            key={'nft_' + i}
            style={{ border: '1px solid rgba(0, 0, 0, 0.3)' }}
            className='rounded-lg overflow-hidden flex flex-col gap-3 pb-4'
          >
            <img
              src={item.assetImg}
              className={cn('w-full rounded-lg ', isERC20 ? 'aspect-video object-contain' : 'aspect-square object-cover')}
            />
            <div className='flex flex-col gap-1 px-4 text-sm whitespace-nowrap'>
              <div>{item.assetName}</div>
              <div>Amount: {displayBn(item.balance, assetDecimals > 0 ? 2 : 0, assetDecimals)}</div>
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
  const {
    data = [],
    refetch,
    isLoading,
  } = useQuery({
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
  if (isLoading) return <Loading />
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
          <OrderCancel order={order} onSuccess={refetch} key={'key'} />,
        ]
      })}
    />
  )
}

const getRole = (item: any, account: string) => {
  const isMaker = item.task_detail?.makerOrders[0]?.parameters.offerer == account
  const isTaker = item.task_detail?.takerOrders[0]?.parameters.offerer == account
  if (isMaker && !isTaker) return 'Maker'
  if (isTaker && !isMaker) return 'Taker'
  return '-'
}

const getSide = (item: any, role: string) => {
  if (role == '-') return '-'
  const type = item?.task_detail?.takerOrders[0]?.parameters.offer[0]?.itemType
  const takerOfferIsUsdc = type === 1
  return role == 'Taker' ? (takerOfferIsUsdc ? 'Buy' : 'Sale') : takerOfferIsUsdc ? 'Sale' : 'Buy'
}

const getDate = (item: any) => {
  if (item.match_timestamp == null) return '-'
  const time = Number(item.match_timestamp) * 1000
  return utcFormat('%Y-%m-%d %H:%M:%S')(new Date(time))
}

const getStatus = (item: any) => {
  const statusMap: { [k: string]: string } = {
    '0': 'Created',
    '1': 'GasPayed',
    '2': 'PrepareSuccess',
    '3': 'CatchRandom',
    '4': 'Matching',
    '5': 'Success',
    '-1': 'PrepareFailed',
    '-2': 'MatchingFailed',
    '-3': 'InvalidGas',
  }
  return statusMap[item.task_status + ''] || '-'
}

const tpKeyOf = (asset: string, assetId: number | string, tokenSymbol: string) =>
  `${asset.toLowerCase()}_${assetId}_${tokenSymbol.toLowerCase()}`

function TradeHistory(p: GeneralProps) {
  const { address } = useAccount()
  const { pairs } = useTradePairs()
  const filterTpMap = useMemo(() => {
    const map: { [k: number | string]: TradePair } = {}
    p.tps.forEach((tp) => {
      map[tpKeyOf(tp.asset, tp.assetId?.toString() || '0', tp.tokenSymbol)] = tp
    })
    return map
  }, [p.tps])
  const tpMap = useMemo(() => {
    const map: { [k: number | string]: TradePair } = {}
    pairs.forEach((tp) => {
      map[tpKeyOf(tp.asset, tp.assetId?.toString() || '0', tp.tokenSymbol)] = tp
    })
    return map
  }, [pairs])
  const { data = [], isLoading } = useQuery({
    queryKey: ['trade-history', address],
    queryFn: async () => {
      if (!address) return []
      return getTradeHistory(address)
    },
  })
  const history = (p.tps.length && address && !isLoading ? data : []).filter(
    (item) => filterTpMap[tpKeyOf(item.collection_address, item.token_id, item.token_name)],
  )
  if (isLoading) return <Loading />
  return (
    <div>
      <div className='flex flex-wrap items-center gap-2'></div>
      <div className='overflow-x-auto pb-5'>
        <STable
          className='min-w-[1500px]'
          span={{ 1: 2, 2: 2, 7: 2, 11: 2 }}
          header={[
            'Order number',
            'Date',
            'Status',
            'Pair',
            'Side',
            'Price',
            'Executed',
            'Role',
            'Min Price/Max Price',
            'Fee',
            'Total',
            'Txn hash',
          ]}
          data={history.map((item: any) => {
            const makerOrder = item?.task_detail?.makerOrders[0]
            const key = tpKeyOf(item.collection_address, item.token_id, item.token_name)
            const { assetIsErc20 } = getOrderAssetInfo(makerOrder, tpMap[key])
            const count = parseBn(makerOrder.numerator + '', assetIsErc20 ? 0 : 18)
            const role = getRole(item, address as any)
            const side = getSide(item, role)
            const tp = tpMap[key]
            const [min, max] = getOrderPerMinMaxBigint(makerOrder, tpMap[key])
            const txLink = getCurrentExploerUrl() + '/tx/' + item.match_tx_hash
            const priceBn = parseBn(item.price)
            const fee = (priceBn * count * 5n) / 1000n / DECIMAL18
            const total = (priceBn * count) / DECIMAL18
            const tokenSymbol = item.token_name

            return [
              shortStr(item.id + ''), // Order number
              getDate(item), // Date
              <span key='status' className={cn({ 'text-green-400': item.task_status > 0, 'text-red-400': item.task_status < 0 })}>
                {getStatus(item)}
              </span>, // Status
              `${tp.assetName}/${tokenSymbol}`, // Pair
              <span key='side' className={cn({ 'text-green-400': side == 'Buy', 'text-red-400': side == 'Sale' })}>
                {side}
              </span>, // Side
              `${getOrderEP(makerOrder as any, tp)} ${tokenSymbol}`, // Price
              `${displayBn(priceBn)} ${tokenSymbol}`, // Executed
              role, // Role
              <div key='minmax'>
                <div>
                  {displayBn(min)} {tokenSymbol}
                </div>
                <div>
                  {displayBn(max)} {tokenSymbol}
                </div>
              </div>, // Min Price/Max Price;
              `${displayBn(fee)} ${tokenSymbol}`, // Fee
              `${displayBn(total)} ${tokenSymbol}`, // Total
              <a href={txLink} target='_blank' key={'link'} rel='noreferrer' className='text-blue-300'>
                {shortStr(item.match_tx_hash, 8, 6)}
              </a>,
            ]
          })}
        />
      </div>
    </div>
  )
}

const TabValues = ['inventory', 'listed', 'bidding', 'history']

export function MyAssets(p: { erc20?: boolean; nfts?: boolean }) {
  const { pairs } = useTradePairs()
  const tps = pairs.filter((pair) => (p.erc20 ? pair.assetType == 'ERC20' : p.nfts ? pair.assetType != 'ERC20' : true))
  const { value, sync } = useSyncSearchParams('tab', TabValues)
  return (
    <Tabs value={value} onValueChange={sync}>
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
        <TradeHistory tps={tps} />
      </TabsContent>
    </Tabs>
  )
}
