import { cn } from '@/lib/utils'

export function CoinIcon({ coin, className }: { coin: string; className?: string }) {
  return <img src={`/coin/${coin.toLowerCase()}.svg`} alt={coin} className={cn('w-6 h-6', className)} />
}
