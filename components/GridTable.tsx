import { cn } from '@/lib/utils'
import React, { CSSProperties, ReactNode } from 'react'

export interface TableProps {
  keyS: string
  header: ReactNode[]
  data: ReactNode[][]
  span?: number[] | { [k: number]: number }
  empty?: ReactNode
  className?: string
  headerClassName?: string
  tbodyClassName?: string
  rowClassName?: string | ((index: number) => string)
  rowStyle?: CSSProperties | ((index: number) => CSSProperties)
  cellClassName?: string | ((index: number, cellIndex: number) => string)
  headerItemClassName?: string
  onClickRow?: (rowIndex: number) => void
  // index -1 表示没有hover在row上
  onRowMouseHover?: (index: number) => void
}

export function DefEmpty() {
  return (
    <div className='text-lg font-normal text-center text-black '>
      <div className='h-[100px] py-5 align-top'></div>
    </div>
  )
}

export const GridTable = ({
  keyS,
  header,
  data,
  span = {},
  empty = <DefEmpty />,
  className = 'relative min-w-full bg-transparent ',
  headerClassName,
  headerItemClassName,
  tbodyClassName = '',
  rowClassName,
  rowStyle,
  cellClassName,
  onClickRow,
  onRowMouseHover,
}: TableProps) => {
  console.log('gridKey:', keyS)
  const gridTemplateColumns = header
    .map((_item, i) => {
      const itemSpan = span[i] != undefined ? span[i] : 1
      return `${itemSpan}fr`
    })
    .join(' ')
  return (
    <div className={className}>
      <div
        style={{ gridTemplateColumns }}
        className={cn(
          'grid text-left w-full font-normal text-black border-b border-gray-100 pt-5 pb-6',
          headerClassName,
        )}
      >
        {header.map((head, i) => (
          <div key={keyS + '_header_' + i} className={cn('p-3 font-normal text-sm', headerItemClassName)}>
            {head}
          </div>
        ))}
      </div>
      <div className={cn(tbodyClassName)}>
        {data.map((items, index) => (
          <div
            key={keyS + '_item_' + index}
            onClick={() => onClickRow && onClickRow(index)}
            onMouseEnter={() => onRowMouseHover && onRowMouseHover(index)}
            onMouseLeave={() => onRowMouseHover && onRowMouseHover(-1)}
            style={{
              gridTemplateColumns,
              ...(typeof rowStyle == 'function' ? rowStyle(index) : rowStyle),
            }}
            className={cn(
              'grid text-black w-full font-medium whitespace-nowrap',
              typeof rowClassName == 'function' ? rowClassName(index) : rowClassName,
            )}
          >
            {items.map((value, i) => {
              if (i >= header.length) return <>{value}</>
              return (
                <div
                  key={keyS + '_cell_' + i}
                  className={cn(
                    'px-3 py-2 text-base',
                    typeof cellClassName == 'function' ? cellClassName(index, i) : cellClassName,
                  )}
                >
                  {value}
                </div>
              )
            })}
          </div>
        ))}
        {data.length === 0 && empty}
      </div>
    </div>
  )
}
export default GridTable
