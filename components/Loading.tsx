import { cn } from '@/lib/utils'

export function Loading({ className, text, loader = 'loading' }: { className?: string; text?: string; loader?: 'loader2' | 'loading' }) {
  return (
    <div className={cn('py-8 px-5 mx-auto flex flex-col gap-8 items-center', className)}>
      <div>
        <div className={cn('my-[50px]', loader)} style={{ fontSize: 18 }} />
      </div>
      {text && <div className='text-base'>{text}</div>}
    </div>
  )
}
