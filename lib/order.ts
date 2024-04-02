import { ItemType, Order, TradePair } from './types'
import { displayBn } from './utils'

export const getOrderAssetInfo = (order: Order, tp: TradePair) => {
  const offerIsAsset = order.parameters.offer[0].token == tp.asset
  const asset = offerIsAsset ? order.parameters.offer[0] : order.parameters.consideration[0]
  const assetIsErc20 = asset.itemType == ItemType.ERC20
  return { offerIsAsset, asset, assetIsErc20 }
}

export const getOrderPerMinMaxBigint = (order: Order, tp: TradePair): [bigint, bigint] => {
  const { offerIsAsset, asset, assetIsErc20 } = getOrderAssetInfo(order, tp)
  const tokens = offerIsAsset ? order.parameters.consideration : order.parameters.offer
  let min = 0n,
    max = 0n
  tokens.forEach((op) => {
    min += BigInt(op.startAmount)
    max += BigInt(op.endAmount)
  })
  const assetDecimals = assetIsErc20 ? 18n : 0n
  const count = BigInt(asset.startAmount)
  return [(min * 10n ** assetDecimals) / count, (max * 10n ** assetDecimals) / count]
}

export const getOrderPerMinMax = (order: Order, tp: TradePair): [string, string] => {
  return getOrderPerMinMaxBigint(order, tp).map((bn) => displayBn(bn)) as any
}

export function getExpectPrice(min: bigint, max: bigint) {
  return (min + max) / 2n
}

export function getOrderEPbigint(order: Order, tp: TradePair) {
  const [min, max] = getOrderPerMinMaxBigint(order, tp)
  return getExpectPrice(min, max)
}

export function getOrderEP(order: Order, tp: TradePair) {
  return displayBn(getOrderEPbigint(order, tp))
}

export const memoPrivilege = {
  privilegeOfferer: '',
}

export const memoAccount = {
  current: '',
}
export function isSelfMaker(order: Order) {
  return order.parameters.offerer == memoAccount.current
}
