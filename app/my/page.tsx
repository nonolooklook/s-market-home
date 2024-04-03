'use client'

import { MyAssets } from '@/components/MyAssets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSyncSearchParams } from '@/lib/hooks/useSyncSearchParams'

const TypeValues = ['nft', 'token']

export default function Home() {
  const { value, sync } = useSyncSearchParams('type', TypeValues)
  return (
    <div className='px-4 md:px-11 w-full'>
      <Tabs value={value} onValueChange={sync}>
        <TabsList className='mb-2 md:mb-10'>
          <TabsTrigger value='nft'>NFT</TabsTrigger>
          <TabsTrigger value='token'>Token</TabsTrigger>
        </TabsList>
        <TabsContent value='nft'>
          <MyAssets nfts />
        </TabsContent>
        <TabsContent value='token'>
          <MyAssets erc20 />
        </TabsContent>
      </Tabs>
    </div>
  )
}
