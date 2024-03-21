'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function Home() {
  const r = useRouter()
  const lastTpId = localStorage.getItem('last-tp-id') || '1'
  const refLast = useRef('')
  useEffect(() => {
    if (lastTpId != refLast.current) {
      refLast.current = lastTpId
      r.push(`/trade/${lastTpId}`)
    }
  }, [lastTpId])
  return <div />
}
