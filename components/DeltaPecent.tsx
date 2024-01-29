import { cn } from '@/lib/utils'
import _ from 'lodash'

export function DeltaPecent({ value, classNmae }: { value: number; classNmae?: string }) {
  const isPlus = value >= 0
  const percent = _.round(value * 100, 2)
  return (
    <div className={cn(isPlus ? 'text-green-400' : 'text-red-400', classNmae)}>{`${isPlus ? '+' : ''}${percent}%`}</div>
  )
}
