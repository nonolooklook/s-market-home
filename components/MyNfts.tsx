import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function MyNfts() {
  return (
    <Tabs defaultValue='inventory'>
      <TabsList>
        <TabsTrigger value='inventory'>Inventory</TabsTrigger>
        <TabsTrigger value='listed'>Listed</TabsTrigger>
        <TabsTrigger value='bidding'>My Bidding</TabsTrigger>
        <TabsTrigger value='history'>Trade History</TabsTrigger>
      </TabsList>
      {/* 这里放置不同的选项卡内容 */}
      <TabsContent value='inventory'>Inventory content</TabsContent>
      <TabsContent value='listed'>Listed content</TabsContent>
      <TabsContent value='bidding'>Bidding content</TabsContent>
      <TabsContent value='history'>History content</TabsContent>
    </Tabs>
  )
}
