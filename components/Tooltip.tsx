import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import { ReactNode } from 'react'
import { Tooltip, TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function SimpleTip({ content }: { content: ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <QuestionMarkCircledIcon className='w-6 h-6 text-orange-500 inline align-text-bottom' />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className=' bg-gray-100 rounded' sideOffset={5}>
            <div className='max-w-[400px] p-3 text-stone-800'>{content}</div>
            <TooltipArrow className='TooltipArrow fill-white' />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  )
}
