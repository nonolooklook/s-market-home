import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { get } from 'lodash'
import { formatUnits, parseUnits } from 'viem'
import { toast } from 'sonner'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMsg(error: any) {
  // msg
  let msg = 'Unkown'
  if (typeof error == 'string') msg = error
  else if (typeof error?.msg == 'string') msg = error?.msg
  else if (typeof error?.message == 'string') msg = error?.message
  // replace
  if (msg.includes('User denied') || msg.includes('user rejected transaction'))
    return 'You declined the action in your wallet.'
  if (msg.includes('transaction failed')) return 'Transaction failed'
  return msg
}

function proxyGetDef<T extends object>(obj: T, def: any) {
  const get = function (target: T, p: string) {
    const hasValue = p in target
    if (hasValue && (target as any)[p] !== null && (target as any)[p] !== undefined) {
      return (target as any)[p]
    }
    ;(target as any)[p] = def
    return (target as any)[p]
  }
  return new Proxy(obj, { get }) as T
}

export function getBigint(result: any, path: string | (string | number)[], def: bigint = 0n) {
  const data = get(result, path, def)
  if (typeof data == 'bigint') return data
  return def
}

export function fmtBn(value: bigint | undefined | null, unit: number = 18, def: bigint = 0n) {
  const bn = typeof value == 'bigint' ? value : def
  return formatUnits(bn, unit)
}
export function displayBn(value: bigint | undefined | null, fixed: number = 2, unit: number = 18, def: bigint = 0n) {
  const strvlaue = fmtBn(value, unit, def)
  return Number(strvlaue).toLocaleString('en-US', {
    maximumFractionDigits: fixed,
    minimumFractionDigits: fixed,
  })
}

export function parseBn(value: string, decimals: number | bigint = 18) {
  const mvaule = !value ? '0' : value
  const mdecimals = typeof decimals == 'bigint' ? parseInt(decimals.toString()) : decimals
  return parseUnits(mvaule.replaceAll(',', ''), mdecimals)
}

export function toJson(data: any) {
  return JSON.stringify(
    data,
    (key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
  )
}

export const ERROR_SIGN_REJECTED = 'User rejected signing request'
export const ERROR_SYSTEM = 'System error'
export const ERROR_MIN_MAX_WRONG_PRICE = 'Min price can`t be greater than max price'
export const ERROR_FILL_SELF_ORDER = 'Cannot match with yourself.'

export const handleError = (e: any) => {
  const err = e.toString()
  console.error(err)
  if (err.includes('rejected signing')) {
    toast.error(ERROR_SIGN_REJECTED)
  } else {
    toast.error(ERROR_SYSTEM)
  }
}

export const sleep = (ms: number): Promise<any> => {
  // add ms millisecond timeout before promise resolution
  return new Promise((resolve) => setTimeout(resolve, ms))
}
