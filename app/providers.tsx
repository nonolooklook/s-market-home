'use client'

// ----------------------- wagmi & connect kit -----------------------------
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import * as React from 'react'
import { Chain, WagmiConfig, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const walletConnectProjectId = 'b3ff10277f66a6ba31bbb88fb6ea4365'

export const SUPPORT_CHAINS: Chain[] = [chain]

const { chains, publicClient, webSocketPublicClient } = configureChains(SUPPORT_CHAINS, [publicProvider()])

export const config = createConfig(
  getDefaultConfig({
    alchemyId: 'rTWFR_ABETT7HZq7wzFNnQE-sI6Gps93',
    walletConnectProjectId: walletConnectProjectId,
    appName: 'S-Market',
    chains: chains,
    autoConnect: true,
    publicClient: publicClient,
    webSocketPublicClient: webSocketPublicClient,
    enableWebSocketPublicClient: true,
    appDescription: 'S-Market Protocol',
  }),
)
config.queryClient.setDefaultOptions({ queries: { cacheTime: 1000 } })

// ----------------------- use query -----------------------------
import { Header } from '@/components/header'
import { chain } from '@/lib/config'
import { cn } from '@/lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NextAdapterApp from 'next-query-params/app'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { QueryParamProvider } from 'use-query-params'
const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isSimulation = pathname.includes('simulation')
  return (
    <div className={cn('w-full h-full min-h-full flex flex-col', { 'bg-green-50/50': isSimulation })}>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <QueryParamProvider adapter={NextAdapterApp}>
            <ConnectKitProvider>
              <Header />
              {children}
            </ConnectKitProvider>
          </QueryParamProvider>
        </QueryClientProvider>
      </WagmiConfig>
      <Toaster position={'top-right'} />
    </div>
  )
}
