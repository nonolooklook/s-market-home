'use client'

import { DeltaPecent } from '@/components/DeltaPecent'
import STable from '@/components/SimpleTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTradePairs } from '@/lib/hooks/useTradePairs'
import { TradePair } from '@/lib/types'
import { StarFilledIcon } from '@radix-ui/react-icons'
import _ from 'lodash'
import { useRouter } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'

export default function Home() {
  const nftTabs = useMemo<string[]>(() => {
    return ['🔥 Trending', '🌈 PFP', '🌟 Watchlist']
  }, [])
  const [currentNftTab, setNftTab] = useState<string>(nftTabs[0])
  const tokenTabs = useMemo<string[]>(() => {
    return ['🔥 ALL', '🌈 FAVORITES']
  }, [])
  const [currentTokenTab, seTokenTab] = useState<string>(tokenTabs[0])
  const { pairs } = useTradePairs()

  const [nfts, tokens, _nfts, _tokens] = useMemo(() => {
    const mnfts: ReactNode[][] = []
    const mtokens: ReactNode[][] = []
    const _nfts: TradePair[] = []
    const _tokens: TradePair[] = []
    pairs.forEach((item) => {
      if (item.assetType == 'ERC20') {
        _tokens.push(item)
        mtokens.push([
          <div key={'star'} className='flex items-center'>
            <StarFilledIcon height={24} width={24} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
          </div>,
          <div key={'project'} className='flex items-center gap-2'>
            <img src={item.assetImg} className='w-10 h-10 rounded-full' />
            <div className='font-semibold'>{item.name}</div>
            {/* <div className='text-gray-400'>Bitcoin</div> */}
          </div>,
          `$${item.tradeInfo?.price?.toFixed(2)}`, // price
          <DeltaPecent key={'percent'} value={_.toNumber(item.tradeInfo.volumeChange24 || '0')} />,
          `$${item.tradeInfo.volume24?.toFixed(2)}`,
          `$${item.tradeInfo.marketCap?.toFixed()}`,
        ])
      } else {
        _nfts.push(item)
        mnfts.push([
          <div key={'star'} className='flex items-center gap-4'>
            <StarFilledIcon height={24} width={24} color={_.random(true) > 0.5 ? '#FFAC03' : '#E2E2E2'} />
            {mnfts.length + 1}
          </div>,
          <div key={'project'} className='flex items-center gap-2'>
            <img src={item.assetImg} className='w-10 h-10 rounded-full' />
            <div className='font-semibold'>{item.name}</div>
          </div>,
          `$${item.tradeInfo?.floorPrice?.toFixed(2)}`, // floorPrice,
          `$${item.tradeInfo.volume24?.toFixed(2)}`,
          <DeltaPecent key={'pencent'} value={_.toNumber(item.tradeInfo.volumeChange24 || '0')} />,
          `${item.tradeInfo.totalSupply}`,
        ])
      }
    })
    return [mnfts, mtokens, _nfts, _tokens]
  }, [pairs])
  const r = useRouter()
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
          <div className='flex gap-2 gap-y-4 flex-wrap'>
            {nftTabs.map((t) => (
              <Button key={t} onClick={() => setNftTab(t)} variant={currentNftTab == t ? 'default' : 'secondary'}>
                {t}
              </Button>
            ))}

            {/* <Input placeholder='Please Search For Name' className='max-w-md w-full ml-auto min-w-[10rem]' /> */}
          </div>
          <Card className='overflow-x-auto flex-1'>
            <STable
              className='min-w-[42.5rem]'
              onClickRow={(index) => r.push(`/trade/${_nfts[index].id}`)}
              span={[2, 4, 3, 3, 3, 3]}
              header={['', 'Collection', 'Floor Price', '24H Volume', '24H Change', 'Supply']}
              data={nfts}
            />
          </Card>
        </div>
        {/* Tokens */}
        <div className='flex flex-col gap-5'>
          <div className='flex gap-2 gap-y-4 flex-wrap'>
            {tokenTabs.map((t) => (
              <Button key={t} onClick={() => seTokenTab(t)} variant={currentTokenTab == t ? 'default' : 'secondary'}>
                {t}
              </Button>
            ))}

            {/* <Input placeholder='Please Search For Name' className='max-w-md w-full ml-auto min-w-[10rem]' /> */}
          </div>
          <Card className='overflow-x-auto flex-1'>
            <STable
              className='min-w-[45rem]'
              onClickRow={(index) => r.push(`/trade/${_tokens[index].id}`)}
              span={[1, 2, 2, 2, 2, 3]}
              header={['', 'Name', 'Price', '24H Volume', '24H Change', 'Marketcap']}
              data={tokens}
            />
          </Card>
        </div>
      </div>
    </main>
  )
}
