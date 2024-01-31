import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { BetaD3Chart } from '../BetaD3Chart'
import { displayBn, parseBn } from '@/lib/utils'
import { FC, Fragment } from 'react'
import { OrderWrapper } from '@/lib/types'
import { getOrderEPbigint, getOrderPerMinMaxBigint } from '@/lib/order'
import { MinMax } from '../MinMax'

type HoverModalListProps = {
  open?: boolean
  onOpenChange?(open: boolean): void
  order: OrderWrapper
}

const HoverModalList: FC<HoverModalListProps> = ({ onOpenChange, order }) => {
  const [min, max] = getOrderPerMinMaxBigint(order.detail)
  const mid = getOrderEPbigint(order.detail)

  return (
    <Fragment>
      <BetaD3Chart minPrice={min} expectedPrice={mid} maxPrice={max} showType='left' defaultValue={30} />
      <MinMax min={displayBn(min) as any} max={displayBn(max) as any} disableInput={true} />
    </Fragment>
  )
}

export default HoverModalList
