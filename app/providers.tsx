'use client'

// ----------------------- wagmi & connect kit -----------------------------
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import * as React from 'react'
import { arbitrumSepolia } from 'viem/chains'
import { Chain, WagmiConfig, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const walletConnectProjectId = 'b3ff10277f66a6ba31bbb88fb6ea4365'

export const SUPPORT_CHAINS: Chain[] = [arbitrumSepolia]

const { chains, publicClient, webSocketPublicClient } = configureChains(SUPPORT_CHAINS, [publicProvider()])

export const config = createConfig(
  getDefaultConfig({
    alchemyId: 'rTWFR_ABETT7HZq7wzFNnQE-sI6Gps93',
    walletConnectProjectId: walletConnectProjectId,
    appName: 'Wand',
    chains: chains,
    autoConnect: true,
    publicClient: publicClient,
    webSocketPublicClient: webSocketPublicClient,
    enableWebSocketPublicClient: true,
    appDescription: 'Wand Protocol',
    appUrl: 'https://wand.fi.',
    appIcon: 'https://wand.fi/logo.svg',
  }),
)
config.queryClient.setDefaultOptions({ queries: { cacheTime: 1000 } })

// ----------------------- appollo client -----------------------------
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/45897/wand/version/latest',
  cache: new InMemoryCache(),
})
// ----------------------- use query -----------------------------
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/header'
import NextAdapterApp from 'next-query-params/app'
import { QueryParamProvider } from 'use-query-params'
import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isSimulation = pathname.includes('simulation')
  return (
    <div className={cn('w-full h-full min-h-full flex flex-col', { 'bg-green-50/50': isSimulation })}>
      <ApolloProvider client={client}>
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
      </ApolloProvider>
      <Toaster position={'top-right'} />
    </div>
  )
}
