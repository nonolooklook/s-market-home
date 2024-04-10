import { calculateBetaDist, calculateBetaFunction, calculateBetaInv } from '@/lib/beta'
import { displayBn as displayBalance } from '@/lib/utils'
import * as d3 from 'd3'
import { useLayoutEffect, useRef, useState } from 'react'

const d = calculateBetaFunction(3, 3)
const data = d.map((t) => (t.x === 0 && t.y === 0 ? { name: 'b', x: 0, y: 0 } : t))

const marginX = 80
const margin = { top: 60, bottom: 0, left: marginX, right: marginX }

export const BetaD3Chart = ({
  minPrice,
  expectedPrice,
  maxPrice,
  withBrush,
  defaultValue,
  showType,
}: {
  minPrice: bigint
  expectedPrice: bigint
  maxPrice: bigint
  withBrush?: boolean
  defaultValue?: number
  showType?: 'left' | 'right'
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [x, setX] = useState(0)
  const [cx, setCx] = useState(0n)
  const [chartW, setChartW] = useState(0)
  const [chartH, setChartH] = useState(0)
  const xPadding = 0

  useLayoutEffect(() => {
    if (!chartRef.current || !svgRef.current) return
    if (minPrice >= 0 && expectedPrice >= 0 && maxPrice >= 0) {
      const chartW = chartRef.current.offsetWidth
      const chartH = 220
      setChartW(chartW)
      setChartH(chartH)
      const width = chartW - margin.left - margin.right
      const height = chartH - margin.top - margin.bottom

      const createGradient = (select: any) => {
        const gradient = select
          .select('defs')
          .append('linearGradient')
          .attr('id', 'gradient')
          .attr('x1', '0')
          .attr('y1', '0')
          .attr('x2', '0')
          .attr('y2', '100%')

        gradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:rgba(255,172,3,.85);stop-opacity:0.2')
        // gradient.append('stop').attr('class', 'end').attr('offset', '100%').attr('style', 'stop-color:#FFAC034D;stop-opacity:1')
        gradient.append('stop').attr('offset', '100%').attr('style', 'stop-color:rgba(255,172,3);stop-opacity:0')
        gradient.raise()
      }

      const svgM = d3.select(svgRef.current)
      const svg = svgM.select('#g')
      const olddefs = svg.select('defs')
      if (!olddefs || !olddefs.node()) {
        svg.append('defs')
        svg.call(createGradient)
      }

      const xScale = d3.scaleLinear().domain([0, 1]).range([0, width])
      const yScale = d3.scaleLinear().domain([0, 1.875]).range([height, 0])

      const line = d3
        .line()
        .x((d: any) => xScale(d.x))
        .y((d: any) => yScale(d.y))
        .curve(d3.curveCatmullRom.alpha(0.5))
      // bg
      svg.select('#bg-path').remove()
      svg
        .append('path')
        .datum(data)
        .attr('id', 'bg-path')
        .attr('d', (d) => line(data as any))
        .style('fill', 'url(#gradient)')
      // line
      svg.select('#curue-line').remove()
      svg
        .append('path')
        .datum(data)
        .attr('id', 'curue-line')
        .attr('d', (d) => line(data as any))
        .attr('stroke-width', '1')
        .style('fill', 'none')
        .style('filter', 'url(#glow)')
        .attr('stroke', '#000')

      svg.select('.domain').attr('stroke', '#ddd')

      const tooltipLine = svg
        .select('#tooltip-line')
        .attr('width', 1)
        .attr('height', 100)
        .attr('x1', 10)
        .attr('y1', 0)
        .attr('x2', 10)
        .attr('y2', 260)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0)
        .style('pointer-events', 'none')
      const createInitEvent = (value: number, target: any): any => {
        if (!target) return null
        const realX = xScale(calculateBetaInv(value / 100, 3, 3))
        const rect = target.getBoundingClientRect()
        let point = (target.ownerSVGElement || target).createSVGPoint()
        point.x = realX
        point.y = 0
        point = point.matrixTransform(target.getScreenCTM())
        const event = new MouseEvent('mousemove', {
          view: window,
          clientX: point.x,
          clientY: rect.y + rect.height / 2,
        })
        return event
      }
      const tooltipArrow = svg.select('#tooltip-arrow').attr('points', '0,0 0,0 0,0').attr('fill', '#000')
      const tooltipEllipse = svg.select('#tooltip-ellipse')
      const tooltipText = svg.select('#tooltip-text')
      const onMouseEvent = function (event: any) {
        const mousePos = d3.pointer(event, svg.node())
        // console.info('ent:', event)
        // console.info('pos:', mousePos)
        const xAccessor = (d: any) => d.x
        const realX = mousePos[0]
        const x = xScale.invert(realX)
        const xBisector = d3.bisector(xAccessor).left
        const bisectionIndex = xBisector(data, x)
        const hoveredIndexData = data[Math.max(0, bisectionIndex - 1)]
        const dx = (BigInt(bisectionIndex) * (maxPrice - minPrice)) / 100n
        const dh = chartH - margin.top - margin.bottom
        const dy = (dh / 1.875) * hoveredIndexData.y
        tooltipLine
          .style('opacity', 1)
          .attr('x1', realX)
          .attr('y1', dh - dy)
          .attr('x2', realX)
          .attr('y2', dh)
          .raise()
        tooltipArrow.attr('opacity', 1).attr('points', `${realX},${dh - dy - 4} ${realX + 6},${dh - dy - 12} ${realX - 6},${dh - dy - 12}`)
        tooltipText
          .attr('x', realX)
          .attr('y', dh - dy - 16)
          .text(displayBalance(dx + minPrice, 2))
          .raise()
        setCx(dx + minPrice)
        setX(x)
      }
      svg.select('#mouse-rect').remove()
      svg
        .append('rect')
        .attr('id', 'mouse-rect')
        .attr('width', chartW - margin.right - margin.left)
        .attr('height', chartH - margin.top - margin.bottom + 100)
        .attr('y', -100)
        .style('opacity', 0.0)
        .on('touchmouse mousemove', onMouseEvent)
        .on('mouseleave', function (event) {
          if (defaultValue != undefined) {
            onMouseEvent(createInitEvent(defaultValue, svg.node()))
          } else {
            tooltipEllipse.attr('opacity', 0)
            tooltipText.text('')
            tooltipLine.style('opacity', 0).raise()
            tooltipArrow.attr('opacity', 0)
          }
        })
      if (defaultValue != undefined) setTimeout(() => onMouseEvent(createInitEvent(defaultValue, svg.node())))
    }
  }, [chartRef, minPrice, expectedPrice, maxPrice, defaultValue])

  useLayoutEffect(() => {
    if (!svgRef.current) return
    if (chartW > 0 || chartH > 0) {
      const width = chartW - margin.left - margin.right
      const height = chartH - margin.top - margin.bottom
      const svgM = d3.select(svgRef.current)
      const svg = svgM.select('#g')

      const endEllipse = svg.select('#end-tooltip-ellipse')
      const endText = svg.select('#end-tooltip-text')
      function brushed(event: any) {
        const selection = event.selection
        if (selection === null) {
          // circle.attr('stroke', null);
        } else {
          const xPercentage = (selection[1] / width) * 100
          d3.selectAll('.end').attr('offset', `${xPercentage}%`)
          if (selection[1] < width) {
            const bp = minPrice + ((maxPrice - minPrice) * BigInt(xPercentage.toFixed(0))) / 100n
            const price = displayBalance(bp)
            // setShowEnd(true)
            // setEndValue(price)

            endText
              .attr('x', selection[1] + 25)
              .attr('y', 56)
              .text(price)
              .raise()
            endEllipse
              .style('opacity', 1)
              .attr('cy', 50)
              .attr('cx', selection[1] + 40)
              .raise()
            // const [x0, x1] = selection.map(x);
            // circle.attr('stroke', (d) => (x0 <= d && d <= x1 ? 'red' : null));
          }
        }
      }

      const brush = d3.brushX().extent([
        [xPadding, 0],
        [width - xPadding, height],
      ])
      // .on('brush', brushed)
      svg.select('#brush-g').remove()
      const brushG = svg
        .append('g')
        .attr('id', 'brush-g')
        .call(brush)
        .call(brush.move, [xPadding, width - xPadding])

      brushG.selectAll('.overlay').style('pointer-events', 'none')
      brushG
        .selectAll('.selection')
        .style('pointer-events', 'none')
        .style('stroke', 'none')
        .style('fill', withBrush ? '#999' : 'none')
      var smallRectWidth = 6
      var smallRectHeight = 20
      const dropTooltip = svg.select('#drop-tooltip')
      brushG
        .select('.handle--e')
        .on('touchmouse mousemove', (event: any) => {
          // const mousePos = d3.pointer(event, this)
          dropTooltip.style('opacity', 0)
        })
        .on('mouseleave', () => {
          dropTooltip.style('opacity', 0)
        })
      brushG
        .selectAll('.handle')
        .style('fill', '#000')
        .style('stroke', 'none')
        .style('width', '2px')
        .attr('pointer-events', 'none')
        .attr('cursor', 'none')
      // brushG.selectAll('.handle').each(function () {
      //   svg.append('rect')
      //     .attr('pointer-events', 'none')
      //     .attr('cursor', 'none')
      //     .attr('width', smallRectWidth)
      //     .attr('height', smallRectHeight)
      //     .attr('x', -smallRectWidth / 2) // 将矩形置于手柄中心
      //     .attr('y', -smallRectHeight / 2)
      //     .attr('fill', 'red')
      // })
    }
  }, [svgRef, chartW, chartH, minPrice, maxPrice, withBrush])

  return (
    <div className={'relative px-16'}>
      <div className={'relative'}>
        {x > 0 && x <= 1 && (
          <>
            {showType == 'left' && (
              <div className='absolute text-xs bottom-20 -ml-16 flex flex-col items-center'>
                Price &lt; {displayBalance(cx, 2)}
                <div className={'px-3 mt-1 py-1 text-xs rounded-full border border-black'}>
                  {(calculateBetaDist(x, 3, 3) * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {showType == 'right' && (
              <div className='absolute bottom-20 right-0 text-xs flex flex-col items-center -mr-16'>
                Price &gt; {displayBalance(cx, 2)}
                <div className={'px-3 mt-1 py-1 text-xs rounded-full border-black border'}>
                  {((1 - calculateBetaDist(x, 3, 3)) * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </>
        )}
        <div className='absolute right-0 text-xs -mr-[60px]' style={{ bottom: margin.bottom + 6 }}>
          Price (USDC)
        </div>
        <div id={'chart'} ref={chartRef} className={'bg-grayx'}>
          <svg ref={svgRef} width={chartW} height={chartH + 15}>
            <rect
              id={'33222'}
              width={1}
              height={chartH - margin.top - margin.bottom}
              x={chartW / 2}
              y={margin.top}
              className={'z-50'}
              stroke={'#000'}
              strokeWidth={1}
              strokeDasharray={'4,4'}
            />
            <text textAnchor='middle' fill='#000' x={chartW / 2} y={margin.top - 30}>
              Expect price
            </text>
            <rect width={chartW - 30} height={1} x={10} y={chartH - margin.bottom} fill={'#000'} />
            <g transform={`translate(${margin.left}, ${margin.top})`} id={'g'}>
              <line id={'tooltip-line'} />
              <polygon id={'tooltip-arrow'} fill={'#000'} points={'2,2 2,2 2,2'} />
              <ellipse ry={16} rx={30} stroke={'#000'} opacity={0} fill={'#00FFE080'} fontSize={14} id={'tooltip-ellipse'} />
              <text id={'tooltip-text'} fontSize={14} fill={'#000000'} textAnchor='middle' />
              <ellipse ry={16} rx={30} stroke={'#000'} opacity={0} fill={'#00FFE080'} fontSize={14} id={'end-tooltip-ellipse'} />
              <text id={'end-tooltip-text'} fontSize={13} fontWeight={800} />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
