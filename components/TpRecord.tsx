import { useApiGet } from '@/lib/api'
import { getOrderDiviation } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { fmtNumber, fmtTime } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { Address, useAccount } from 'wagmi'
import { Loading } from './Loading'
import { OrderCancel } from './MyAssets'
import STable from './SimpleTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

function MakerOrders({ tp, address }: { tp: TradePair; address: Address }) {
  // type: make,pending,history,recent
  const { isLoading, data, refetch } = useApiGet<OrderWrapper[]>(`/common/order/tradingPair/${tp.id}/order/${address}/make`)
  const rows = useMemo(
    () =>
      (data || []).reverse().map((item) => {
        return [
          fmtNumber(item.remaining_item_size),
          fmtNumber(item.min_price),
          fmtNumber(item.max_price),
          getOrderDiviation(item.detail, tp),
          item.order_type === 2 ? 'Sell' : 'Buy',
          fmtTime(item.create_time),
          <OrderCancel order={item} onSuccess={refetch} />,
        ]
      }),
    [data],
  )
  if (isLoading) return <Loading />
  return (
    <div className='overflow-x-auto pb-5'>
      <STable header={['Amount', 'Min Price', 'Max Price', 'Deviation', 'Order Type', 'Time', '']} data={rows} />
    </div>
  )
}

export function TpRecord({ tp }: { tp: TradePair }) {
  const [value, setValue] = useState('makerOrders')
  const { address } = useAccount()
  return (
    <div>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList className=''>
          <TabsTrigger value='makerOrders'>Your Maker Order</TabsTrigger>
          <TabsTrigger value='pendingOrders'>Your Pending Order</TabsTrigger>
          <TabsTrigger value='history'>Trade History</TabsTrigger>
          <TabsTrigger value='recent'>Recent Order</TabsTrigger>
        </TabsList>
        {/* 这里放置不同的选项卡内容 */}
        <TabsContent value='makerOrders'>{address && <MakerOrders tp={tp} address={address} />}</TabsContent>
        <TabsContent value='pendingOrders'></TabsContent>
        <TabsContent value='recent'></TabsContent>
        <TabsContent value='history'></TabsContent>
      </Tabs>
    </div>
  )
}
