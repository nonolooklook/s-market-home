'use client'

import { DeltaPecent } from '@/components/DeltaPecent'
import STable from '@/components/SimpleTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StarFilledIcon } from '@radix-ui/react-icons'
import _ from 'lodash'
import { useMemo, useState } from 'react'
import { Providers } from './providers'

export function Home() {
  const nftTabs = useMemo<string[]>(() => {
    return ['🔥 Trending', '🌈 PFP', '🌟 Watchlist']
  }, [])
  const [currentNftTab, setNftTab] = useState<string>(nftTabs[0])
  const tokenTabs = useMemo<string[]>(() => {
    return ['🔥 ALL', '🌈 FAVORITES']
  }, [])
  const [currentTokenTab, seTokenTab] = useState<string>(tokenTabs[0])

  const nfts = useMemo(() => {
    return _.range(1, 11).map((num) => [
      <div className='flex items-center gap-4'>
        <StarFilledIcon height={24} width={24} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
        {num}
      </div>,
      <div className='flex items-center gap-2'>
        <img src='/nfts.png' className='w-10 h-10 rounded-full' />
        <div className='font-semibold'>Project X</div>
      </div>,
      '5,678.45',
      '5,678.45',
      <DeltaPecent value={(0.5 - _.random(true)) * 3} />,
      '100000',
    ])
  }, [])

  const tokens = useMemo(() => {
    return _.range(1, 11).map((num) => [
      <div className='flex items-center'>
        <StarFilledIcon height={24} width={24} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
      </div>,
      <div className='flex items-center gap-2'>
        <img src='/tokens.png' className='w-10 h-10 rounded-full' />
        <div className='font-semibold'>BTC</div>
        <div className='text-gray-400'>Bitcoin</div>
      </div>,
      '5,678.45',
      <DeltaPecent value={(0.5 - _.random(true)) * 3} />,
      '5,678.45',
      '¥2348,121,123B',
    ])
  }, [])
  return (
    <main>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <Card className='relative'>
          <div className='absolute top-0 z-[-1] left-0 w-[60%] h-[80%] bg-stone-300 rounded-full blur-[50px]' />
          <div className='absolute z-[-1] right-[10%] bottom-[5%] w-[50%] h-[70%] bg-teal-200 rounded-full blur-[50px]' />
          <CardTitle>NFT</CardTitle>
          <CardDescription>MARKET</CardDescription>
          <CardContent className='flex flex-col items-center justify-center flex-1'>
            <img src='/nfts.png' className='h-[256px] w-auto object-contain' />
          </CardContent>
          <div className='text-xl font-medium'>Welcome to the S market</div>
          <div className='text-base font-normal'>
            You can rely on luck to purchase your favorite NFTs at a lower price
          </div>
        </Card>
        <Card className='relative'>
          <div className='absolute z-[-1] bottom-[30%] right-[20%] w-[60%] h-[50%] bg-blue-400/70 rounded-full blur-[50px]' />
          <CardTitle>Token</CardTitle>
          <CardDescription>MARKET</CardDescription>
          <CardContent className='flex flex-col items-center justify-center flex-1'>
            <img src='/tokens.png' className='h-[180px] w-auto object-contain' />
          </CardContent>
          <div className='text-xl font-medium'>Top Tokens by heat</div>
          <div className='text-base font-normal'>
            You can rely on luck to purchase your favorite NFTs at a lower price
          </div>
        </Card>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-full'>
        {/* Nfts */}
        <div className='flex flex-col gap-5'>
          <div className='flex gap-2'>
            {nftTabs.map((t) => (
              <Button key={t} onClick={() => setNftTab(t)} variant={currentNftTab == t ? 'default' : 'secondary'}>
                {t}
              </Button>
            ))}
            <div className='flex-1' />
            <Input placeholder='Please Search For Name' className='max-w-md' />
          </div>
          <Card className='overflow-x-auto'>
            <STable
              className='min-w-[42.5rem]'
              span={[2, 4, 3, 3, 3, 3]}
              header={['', 'Collection', 'Floor Price', '24H Volume', '24H Change', 'Supply']}
              data={nfts}
            />
          </Card>
        </div>
        {/* Tokens */}
        <div className='flex flex-col gap-5'>
          <div className='flex gap-2'>
            {tokenTabs.map((t) => (
              <Button key={t} onClick={() => seTokenTab(t)} variant={currentTokenTab == t ? 'default' : 'secondary'}>
                {t}
              </Button>
            ))}
            <div className='flex-1' />
            <Input placeholder='Please Search For Name' className='max-w-md' />
          </div>
          <Card className='overflow-x-auto'>
            <STable
              className='min-w-[42.5rem]'
              span={[1, 4, 2, 2, 2, 3]}
              header={['', 'Name', 'Price', '24H Volume', '24H Change', 'Marketcap']}
              data={tokens}
            />
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Providers>
      <Home />
    </Providers>
  )
}
