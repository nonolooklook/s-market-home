import { Address, useContractRead, useContractWrite } from 'wagmi'
import SmeGasManager from '../abi/SmeGasManager'
import { getCurrentGasManagerAddress } from '../config'
import { getBigint } from '../utils'

export const useRequestMatchOrder = () => {
  const perGasFee = useContractRead({
    abi: SmeGasManager,
    address: getCurrentGasManagerAddress(),
    functionName: 'gasFee',
  })

  const { writeAsync } = useContractWrite({
    abi: SmeGasManager,
    address: getCurrentGasManagerAddress(),
    functionName: 'requestMatchOrder',
  })
  return async (hashes: Address[]) => {
    const fee = getBigint(perGasFee, 'data')
    if (fee == 0n) throw 'Get gas fee error'
    await writeAsync({ args: [hashes], value: fee * BigInt(hashes.length) })
  }
}
