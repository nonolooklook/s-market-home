import { ReactNode } from 'react'
import { Tooltip, TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function RowTip({ content, trigger }: { content: ReactNode; trigger: ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className=' bg-gray-100 rounded' sideOffset={5}>
            <div className='max-w-[500px] p-3 text-stone-800'>{content}</div>
            <TooltipArrow className='TooltipArrow fill-white' />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  )
}
