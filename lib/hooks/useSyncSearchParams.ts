import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useSyncSearchParams(key: string, values: string[], def?: string) {
  const sp = useSearchParams()
  const r = useRouter()
  const [tab, setTab] = useState<string>(def || sp.get(key) || values[0])
  const stab = sp.get(key) as string
  const sync = (value?: string) => {
    const usp = new URLSearchParams(location.search)
    usp.set(key, value || values[0])
    r.push(`?${usp.toString()}`)
  }
  useEffect(() => {
    if (values.includes(stab)) {
      setTab(stab)
    } else {
      sync(tab)
    }
  }, [key, values, stab])

  return { value: tab, sync }
}
