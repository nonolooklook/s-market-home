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
import { Header } from '@/components/header'
import NextAdapterApp from 'next-query-params/app'
import { QueryParamProvider } from 'use-query-params'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <ApolloProvider client={client}>
      <WagmiConfig config={config}>
        <QueryParamProvider adapter={NextAdapterApp}>
          <ConnectKitProvider>
            <Header />
            {mounted && children}
          </ConnectKitProvider>
        </QueryParamProvider>
      </WagmiConfig>
    </ApolloProvider>
  )
}
