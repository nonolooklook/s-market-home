'use client'

import { memoAccount } from '@/lib/order'
import { cn } from '@/lib/utils'
import { ChainIcon, ConnectKitButton } from 'connectkit'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { FiMenu } from 'react-icons/fi'
import { useMediaQuery } from 'usehooks-ts'
import { Address, useAccount, useNetwork } from 'wagmi'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
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
  const mLinks = useMemo(
    () =>
      (isAdmin(address) ? links.concat([{ href: '/admin', label: 'Admin' }]) : links),
    [address],
  )
  memoAccount.current = address as any
  const isMd = useMediaQuery('(min-width: 768px)')
  return (
    <header
      style={{
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.05)',
      }}
      className={cn(
        'flex sticky top-0 w-[calc(100%-2rem)] md:w-[calc(100%-5.5rem)] items-center justify-between mx-4 md:mx-11 my-2 md:my-5 px-2 md:px-5 py-3 bg-white border border-gray-100 rounded-lg z-50',
      )}
    >
      <div className='flex items-center gap-2 md:gap-8'>
        <img src='/logo.png' alt='logo' className='cursor-pointer object-left object-cover w-9 h-9 md:w-32' />
        {isMd &&
          mLinks.map((item) => (
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
        {!isMd && (
          <DropdownMenu>
            <DropdownMenuTrigger className='px-2 cursor-pointer outline-none text-2xl shrink-0'>
              <FiMenu />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {mLinks.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  disabled={pathname == item.href || (pathname.startsWith(item.href) && item.href !== '/')}
                  onClick={() => r.push(item.href)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className='flex items-center gap-5'>
        {chain && (
          <div className='flex items-center gap-2'>
            <ChainIcon id={chain.id} unsupported={chain.unsupported} />
            {isMd && <span>{chainName}</span>}
          </div>
        )}
        <ConnectKitButton />
      </div>
    </header>
  )
}
