import { TradePair } from '@/lib/types'
import { Button } from './ui/button'
import { useApiPost } from '@/lib/api'
import { useAccount } from 'wagmi'
import { Spinner } from './Spinner'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'

export function ResetSimulation({ tp, onSuccess }: { tp: TradePair; onSuccess?: () => void }) {
  const { address } = useAccount()
  const { mutateAsync, isPending } = useApiPost(`/mock/claim/${address}/${tp.id}/reset`)
  return (
    <Button
      disabled={isPending}
      onClick={() =>
        !isPending &&
        mutateAsync()
          .then(() => {
            toast.success('Reset Success!')
            onSuccess && onSuccess()
          })
          .catch(handleError)
      }
    >
      {isPending && <Spinner />} Reset
    </Button>
  )
}
