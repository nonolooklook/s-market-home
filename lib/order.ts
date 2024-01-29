import { parseUnits } from 'viem'
import { displayBn } from './utils'

export const getBidOrderMinPrice = (order: any) => {
  const minP = order?.entry?.parameters?.offer?.[0]?.startAmount
  const count = parseUnits(order?.entry?.parameters?.consideration?.[0]?.startAmount, 0)
  return Number(displayBn(BigInt(minP) / count).replace(',', ''))
}

export const getBidOrderMaxPrice = (order: any) => {
  const maxP = order?.entry?.parameters?.offer?.[0]?.endAmount
  const count = parseUnits(order?.entry?.parameters?.consideration?.[0]?.startAmount, 0)
  return Number(displayBn(BigInt(maxP) / count).replace(',', ''))
}

export const getListOrderMinPrice = (order: any) => {
  const minP = order?.entry?.parameters?.consideration?.[0]?.startAmount
  const count = parseUnits(order?.entry?.parameters?.offer?.[0]?.startAmount, 0)
  return Number(displayBn(BigInt(minP) / count).replace(',', ''))
}

export const getListOrderMaxPrice = (order: any) => {
  const maxP = order?.entry?.parameters?.consideration?.[0]?.endAmount
  const count = parseUnits(order?.entry?.parameters?.offer?.[0]?.startAmount, 0)
  return Number(displayBn(BigInt(maxP) / count).replace(',', ''))
}

const getFraction = (num: number, den: number, value: bigint): bigint => {
  return (BigInt(num) * value) / BigInt(den)
}

export const getOrderMinMaxBigint = (order: any): [bigint, bigint] => {
  const num = order?.numerator || 1
  const den = order?.denominator || 1
  const ops: any[] =
    order.parameters.offer[0]?.itemType == 1 ? order?.parameters.offer : order?.parameters.consideration
  let min = 0n,
    max = 0n
  ops.forEach((op) => {
    min += BigInt(op.startAmount)
    max += BigInt(op.endAmount)
  })
  return [getFraction(num, den, min), getFraction(num, den, max)]
}

export const getOrderMinMax = (order: any): [string, string] => {
  return getOrderMinMaxBigint(order).map((bn) => displayBn(bn)) as any
}

export const getOrderPerMinMaxBigint = (order: any): [bigint, bigint] => {
  const ops: any[] =
    order.parameters.offer[0]?.itemType == 1 ? order?.parameters.offer : order?.parameters.consideration
  let min = 0n,
    max = 0n
  ops.forEach((op) => {
    min += BigInt(op.startAmount)
    max += BigInt(op.endAmount)
  })
  const nft = order.parameters.offer[0]?.itemType == 1 ? order?.parameters.consideration[0] : order?.parameters.offer[0]
  const count = BigInt(nft.startAmount)
  return [min / count, max / count]
}

export const getOrderPerMinMax = (order: any): [string, string] => {
  return getOrderPerMinMaxBigint(order).map((bn) => displayBn(bn)) as any
}

export function getExpectPrice(min: bigint, max: bigint) {
  return (min + max) / 2n
}

export function getOrderEPbigint(order: any) {
  const [min, max] = getOrderPerMinMaxBigint(order)
  // if (isPrivilegeOrder(order)) return privilegeExpectPrice
  return getExpectPrice(min, max)
}

export function getOrderEP(order: any) {
  return displayBn(getOrderEPbigint(order))
}

export const memoPrivilege = {
  privilegeOfferer: '',
}

// export function isPrivilegeOrder(order: any) {
//   const [min, max] = getOrderPerMinMaxBigint(order)
//   return (order.type == '3' && min !== max) || (min !== max && order.parameters.offerer == memoPrivilege.privilegeOfferer)
// }

export const memoAccount = {
  current: '',
}
export function isSelfMaker(order: any) {
  return order.parameters.offerer == memoAccount.current
}
