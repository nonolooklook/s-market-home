import { privilegeOrderRange } from '@/config/privilege'
import { calculateBetaDist, calculateBetaFunction, calculateBetaInv } from '@/utils/beta'
import { displayBalance } from '@/utils/display'
import * as d3 from 'd3'
import { Fragment, useLayoutEffect, useRef, useState } from 'react'

const defData = [
  { ...privilegeOrderRange[0], beta: 9989, flex: 15 },
  { ...privilegeOrderRange[1], beta: 10, flex: 4 },
  { ...privilegeOrderRange[2], beta: 1, flex: 1 },
]

const bottom = 20
const lSpace = 40 // xAxis
const rSpace = 40 // xAxis
const tSpace = 20 // yAxis
const lPadding = 60 // chart
const rPadding = 60 // chart
const gap = 30 // xAxis gap

export const BetaD3Chart3 = ({ data = defData }: { data?: { min: number; max: number; beta: number; flex: number }[] }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [x, setX] = useState(0)
  const [cx, setCx] = useState(0n)
  const [chartW, setChartW] = useState(0)
  const [chartH, setChartH] = useState(0)
  useLayoutEffect(() => {
    if (!chartRef.current || !svgRef.current) return
    // if (rendered) return
    if (data.length == 0) return
    const chartW = chartRef.current.offsetWidth
    console.log(chartW)
    const chartH = 220
    setChartW(chartW)
    setChartH(chartH)
    const width = chartW
    const height = chartH

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
    }

    const svg = d3.select(svgRef.current)
    const olddefs = svg.select('defs')
    if (!olddefs || !olddefs.node()) {
      svg.append('defs')
      svg.call(createGradient)
    }

    let sumbeta = 0,
      sumflex = 0
    data.forEach((item) => {
      sumbeta = item.beta + sumbeta
      sumflex = item.flex + sumflex
    })
    const count = data.length
    const itemWidth = (width - gap * (count - 1) - lSpace - rSpace - lPadding - rPadding) / count
    const xRangeDatas: {
      xRange: [number, number]
      data: number[]
      item: (typeof defData)[0]
      itemIndex: number
      xScaler: d3.ScaleLinear<number, number, never>
      yScaler: d3.ScaleLinear<number, number, never>
      cScaler: d3.ScaleLinear<number, number, never>
    }[] = []
    let tempSumbeta = 0

    data.forEach((item, index) => {
      const xOffset = index * (itemWidth + gap) + lSpace + lPadding
      const yScale = d3
        .scaleLinear()
        .domain([0, 1.875])
        .range([height, (height * (sumflex - item.flex)) / sumflex])
      const xRange: [number, number] = [xOffset, xOffset + itemWidth]
      const xScale = d3.scaleLinear().domain([0, 1]).range(xRange)
      const line = d3
        .line()
        .x((d: any) => xScale(d.x))
        .y((d: any) => yScale(d.y) - bottom)
        .curve(d3.curveCatmullRom.alpha(0.5))
      const d = calculateBetaFunction(index == 0 ? 2 : 3, 3)
      const itemdata = d.map((t) => (t.x === 0 && t.y === 0 ? { name: 'b', x: 0, y: 0 } : t))
      xRangeDatas.push({
        item: item as any,
        itemIndex: index,
        xRange,
        data: itemdata.map((item) => item.y),
        xScaler: xScale,
        yScaler: yScale,
        cScaler: d3.scaleLinear().domain(xRange).range([item.min, item.max]),
      })
      tempSumbeta += item.beta

      svg.select(`#bg-path-${index}`).remove()
      svg
        .append('path')
        .datum(itemdata)
        .attr('id', `bg-path-${index}`)
        .attr('d', (d) => line(itemdata as any))
        .style('fill', 'url(#gradient)')
      svg.select(`#line-path-${index}`).remove()
      svg
        .append('path')
        .datum(itemdata)
        .attr('id', `line-path-${index}`)
        .attr('d', (d) => line(itemdata as any))
        .attr('stroke-width', '1')
        .style('fill', 'none')
        .style('filter', 'url(#glow)')
        .attr('stroke', '#fff')
      const xAxisOffset = index > 0 ? xOffset : lPadding
      const xAxisWidth = index == 0 ? itemWidth + lSpace : index == count - 1 ? itemWidth + rSpace : itemWidth
      svg.select(`#xaxis-line-${index}`).remove()
      svg
        .append('rect')
        .attr('id', `xaxis-line-${index}`)
        .attr('x', xAxisOffset)
        .attr('y', height - bottom)
        .attr('width', xAxisWidth)
        .attr('height', 1)
        .attr('fill', '#fff')
      if (index > 0) {
        svg.select(`#xaxis-line-gap-${index}`).remove()
        svg
          .append('line')
          .attr('id', `xaxis-line-gap-${index}`)
          .attr('x1', xAxisOffset - gap)
          .attr('y1', height - bottom)
          .attr('x2', xAxisOffset)
          .attr('y2', height - bottom)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')
      }
      svg
        .select(`#xaxis-text-l-${index}`)
        .text(item.min.toFixed())
        .attr('x', xRange[0])
        .attr('y', height - 6)
      svg
        .select(`#xaxis-text-r-${index}`)
        .text(item.max.toFixed())
        .attr('x', xRange[1])
        .attr('y', height - 6)
    })

    const tooltipLine = svg
      .select('#tooltip-line')
      .attr('width', 1)
      .attr('height', height - bottom)
      .attr('x1', 10)
      .attr('y1', 0)
      .attr('x2', 10)
      .attr('y2', 260)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0)
      .style('pointer-events', 'none')
    const tooltipArrow = svg.select('#tooltip-arrow').attr('points', '0,0 0,0 0,0').attr('fill', '#fff')
    const tooltipText = svg.select('#tooltip-text')

    const createInitEvent = (): any => {
      const node = svg.node()
      if (!node) return null
      const rect = node.getBoundingClientRect()
      let point = ((node as any)?.ownerSVGElement || node).createSVGPoint()
      const item = xRangeDatas[0]
      const rate = (sumbeta * 0.7) / item.item.beta
      const betaX = calculateBetaInv(rate, item.item.a, item.item.b)
      point.x = rect.left + lSpace + lPadding + itemWidth * betaX
      point.y = 0
      // console.info('p:', point.x)
      point.matrixTransform(node.getScreenCTM())
      const event = new MouseEvent('mousemove', {
        view: window,
        clientX: point.x,
        clientY: 100,
      })
      return event
    }
    const onMouseEvnet = (event: any) => {
      const mousePos = d3.pointer(event, svg.node())
      const realX = mousePos[0]
      // console.info('realX:', realX, event == initEvent)
      const rd = xRangeDatas.find((item) => item.xRange[0] <= realX && realX <= item.xRange[1])
      if (!rd) {
        event.isTrusted && onMouseEvnet(createInitEvent())
      } else {
        const betaX = rd.xScaler.invert(realX)
        const index = Math.round(betaX * 100)
        const topY = rd.yScaler(rd.data[index]) - bottom
        const cx = BigInt((rd.cScaler(realX) * 10 ** 4).toFixed(0) + '00000000000000')
        tooltipLine
          .style('opacity', 1)
          .attr('x1', realX)
          .attr('y1', topY)
          .attr('x2', realX)
          .attr('y2', height - bottom)
          .raise()
        tooltipText
          .text(displayBalance(cx, 2))
          .attr('x', realX)
          .attr('y', topY - 14)
        tooltipArrow.attr('opacity', 1).attr('points', `${realX},${topY - 4} ${realX + 6},${topY - 10} ${realX - 6},${topY - 10}`)
        let tempSumBetaRate = 0
        for (let i = 0; i < rd.itemIndex; i++) {
          const xrd = xRangeDatas[i]
          tempSumBetaRate += xrd.item.beta / sumbeta
        }
        setX(tempSumBetaRate + (calculateBetaDist(betaX, rd.item.a, rd.item.b) * rd.item.beta) / sumbeta)
        setCx(cx)
      }
    }
    setTimeout(() => onMouseEvnet(createInitEvent()), 100)
    svg.select('#rect-mouse').remove()
    svg
      .append('rect')
      .attr('id', 'rect-mouse')
      .attr('width', width)
      .attr('height', height)
      .style('opacity', 0.0)
      .on('touchmouse mousemove', onMouseEvnet)
      .on('mouseleave', function (event) {
        onMouseEvnet(createInitEvent())
      })
  }, [chartRef, data])

  return (
    <div className={'relative w-full'}>
      <div className={'relative'}>
        {x > 0 && x <= 1 && (
          <div className={''}>
            {/* <div className='absolute text-xs bottom-20 left-2 flex flex-col items-center'>
              Price &lt; {displayBalance(cx, 2)}
              <div className={'px-3 mt-1 py-1 text-xs rounded-full border border-white'}>{(x * 100).toFixed(4)}%</div>
            </div> */}
            <div className='absolute bottom-20 right-0 text-xs flex flex-col items-center'>
              Price &gt; {displayBalance(cx, 2)}
              <div className={'px-3 mt-1 py-1 text-xs rounded-full border-white border'}>{((1 - x) * 100).toFixed(4)}%</div>
            </div>
          </div>
        )}
        <div className='absolute bottom-0.5 right-0 text-xs'>Price (USDC)</div>
        <div id={'chart'} ref={chartRef} className={'bg-grayx'}>
          <svg ref={svgRef} width={chartW} height={chartH}>
            <line id={'tooltip-line'} />
            <polygon id={'tooltip-arrow'} fill={'#fff'} points={'2,2 2,2 2,2'} />
            <ellipse ry={16} rx={30} stroke={'#fff'} opacity={0} fill={'#00FFE080'} fontSize={14} id={'tooltip-ellipse'} />
            <text id={'tooltip-text'} fontSize={13} fill={'#fff'} textAnchor='middle' />
            <ellipse ry={16} rx={30} stroke={'#fff'} opacity={0} fill={'#00FFE080'} fontSize={14} id={'end-tooltip-ellipse'} />
            <text id={'end-tooltip-text'} fontSize={13} fontWeight={800} />
            {data.map((item, i) => (
              <Fragment key={i}>
                <text id={`xaxis-text-l-${i}`} fontSize={13} fill='#fff' textAnchor='middle' />
                <text id={`xaxis-text-r-${i}`} fontSize={13} fill='#fff' textAnchor='middle' />
              </Fragment>
            ))}
            <rect width={1} height={chartH - bottom - tSpace} fill='#fff' x={lPadding + lSpace} y={tSpace} />
            <rect width={1} height={chartH - bottom - tSpace} fill='#fff' x={chartW - rPadding - rSpace} y={tSpace} />
          </svg>
        </div>
      </div>
    </div>
  )
}
