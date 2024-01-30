import { getBigint, getErrorMsg } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { erc20ABI, useAccount, useBlockNumber, usePublicClient, useWalletClient, type Address } from 'wagmi'

const cacheAllowance: { [k: Address]: { [k: Address]: bigint } } = {}
const NativeToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const useApproves = (
  needAllownce: { [k: Address]: bigint },
  spender: Address | undefined,
  reqBigAmount: bigint | false = 10000000000n * BigInt(10 ** 18),
) => {
  const { address } = useAccount()
  const clinet = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isSuccess, setSuccess] = useState(false)
  const tokens = useMemo(
    () => Object.keys(needAllownce).filter((item) => item !== NativeToken) as Address[],
    [needAllownce],
  )
  const [allowance, setAllownce] = useState<{ [k: Address]: bigint }>(spender ? cacheAllowance[spender] || {} : {})
  const updateAllownce = useCallback(
    (token: Address, value: bigint) => {
      if (!spender) return
      cacheAllowance[spender] = { ...(cacheAllowance[spender] || {}), [token]: value }
      setAllownce((old) => ({ ...old, [token]: value }))
    },
    [spender],
  )
  const { data: blocknumber } = useBlockNumber()
  useEffect(() => {
    if (!address || !spender) {
      return
    }
    tokens.forEach((t) => {
      clinet
        .readContract({ abi: erc20ABI, address: t, functionName: 'allowance', args: [address, spender] })
        .then((value) => updateAllownce(t, value))
        .catch(console.error)
    })
  }, [tokens, spender, address, blocknumber, updateAllownce, clinet])
  const [loading, setLoading] = useState(false)
  const needApproves = useMemo(() => {
    return tokens.filter((t) => getBigint(needAllownce, t) > 0n && getBigint(needAllownce, t) > getBigint(allowance, t))
  }, [needAllownce, tokens, allowance])
  const approve = async () => {
    if (needApproves.length == 0 || !spender) return
    try {
      setLoading(true)
      setSuccess(false)
      for (let index = 0; index < needApproves.length; index++) {
        const token = needApproves[index]
        // const allowanceValue = needAllownce[token]
        const allowanceValue = reqBigAmount === false ? needAllownce[token] : reqBigAmount
        const txHash = await walletClient?.writeContract({
          abi: erc20ABI,
          address: token,
          functionName: 'approve',
          args: [spender, allowanceValue],
        })
        txHash && (await clinet?.waitForTransactionReceipt({ hash: txHash }))
        updateAllownce(token, allowanceValue)
      }
      toast.success('Approve success')
      setLoading(false)
      setSuccess(true)
    } catch (error) {
      toast.error(getErrorMsg(error))
      setLoading(false)
      setSuccess(false)
      throw error
    }
  }
  return { approve, loading, shouldApprove: needApproves.length > 0, isSuccess }
}
