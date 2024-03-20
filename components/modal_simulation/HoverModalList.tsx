import { getOrderEPbigint, getOrderPerMinMaxBigint } from '@/lib/order'
import { OrderWrapper, TradePair } from '@/lib/types'
import { displayBn } from '@/lib/utils'
import { FC, Fragment } from 'react'
import { BetaD3Chart } from '../BetaD3Chart'
import { MinMax } from '../MinMax'

type HoverModalListProps = {
  order: OrderWrapper
  tp: TradePair
}

const HoverModalList: FC<HoverModalListProps> = ({ order, tp }) => {
  const [min, max] = getOrderPerMinMaxBigint(order.detail, tp)
  const mid = getOrderEPbigint(order.detail, tp)

  return (
    <Fragment>
      <BetaD3Chart
        minPrice={min}
        expectedPrice={mid}
        maxPrice={max}
        showType={order.order_type == 2 ? 'left' : 'right'}
        defaultValue={order.order_type == 2 ? 30 : 70}
      />
      <MinMax min={displayBn(min) as any} max={displayBn(max) as any} disableInput={true} />
    </Fragment>
  )
}

export default HoverModalList
