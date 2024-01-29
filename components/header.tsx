'use client'

import { cn } from '@/lib/utils'
import { ChainIcon, ConnectKitButton } from 'connectkit'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Address, useAccount, useNetwork } from 'wagmi'
import { Button } from './ui/button'

const links = [
  { href: '/', label: 'Market' },
  { href: '/trade', label: 'Trade' },
  { href: '/my', label: 'My Assets' },
]

const admins: Address[] = ['0xFE18Aa1EFa652660F36Ab84F122CD36108f903B6']
const isAdmin = (address?: Address) => {
  if (!address) return false
  return !!admins.find((add) => add == address)
}
export function Header() {
  const r = useRouter()
  const pathname = usePathname()
  const { chain, chains } = useNetwork()
  const chainName = chains.find((c) => c.id === chain?.id)?.name
  const { address } = useAccount()
  return (
    <header
      className={cn(
        'flex sticky top-0 w-[calc(100%-5.5rem)] items-center justify-between mx-11 my-5 px-5 bg-white border border-gray-100 rounded-lg h-16 z-50',
      )}
    >
      <div className='flex items-center gap-8'>
        <Image height={36} width={128} src='/logo.png' alt='logo' />
        {links.map((item) => (
          <Button
            key={item.href}
            variant={
              pathname == item.href || (pathname.startsWith(item.href) && item.href !== '/') ? 'default' : 'ghost'
            }
            onClick={() => r.push(item.href)}
          >
            {item.label}
          </Button>
        ))}
        {isAdmin(address) && (
          <Button variant={pathname == '/admin' ? 'default' : 'ghost'} onClick={() => r.push('/admin')}>
            Admin
          </Button>
        )}
      </div>
      <div className='flex items-center gap-5'>
        {chain && (
          <div className='flex items-center gap-2'>
            <ChainIcon id={chain.id} unsupported={chain.unsupported} />
            <span>{chainName}</span>
          </div>
        )}
        <ConnectKitButton />
      </div>
    </header>
  )
}
