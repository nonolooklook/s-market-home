'use client'

import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'

const links = [
  { href: '/', label: 'Market' },
  { href: '/trade', label: 'Trade' },
  { href: '/my', label: 'My Assets' },
]

export function Header() {
  const r = useRouter()
  const pathname = usePathname()
  console.info('Header')
  return (
    <header className={cn('flex fixed w-[calc(100%-5.5rem)] items-center justify-between mx-11 my-5 px-5 bg-white border border-gray-100 rounded-lg h-16')}>
      <div className='flex items-center gap-8'>
        {links.map((item) => (
          <Button variant={pathname == item.href ? 'default' : 'ghost'} onClick={() => r.push(item.href)}>
            {item.label}
          </Button>
        ))}
      </div>
      <div>
        <ConnectKitButton />
      </div>
    </header>
  )
}
