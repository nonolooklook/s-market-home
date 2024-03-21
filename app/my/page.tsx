'use client'

import { MyAssets } from '@/components/MyAssets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
  return (
    <div className='px-4 md:px-11 w-full'>
      {/* <Tabs defaultValue='nft'>
        <TabsList className='mb-2 md:mb-10'>
          <TabsTrigger value='nft'>NFT</TabsTrigger>
          <TabsTrigger value='token'>Token</TabsTrigger>
        </TabsList>
        <TabsContent value='nft'>
         
        </TabsContent>
        <TabsContent value='token'>
          <MyAssets erc20 />
        </TabsContent>
      </Tabs> */}
      <MyAssets />
    </div>
  )
}
