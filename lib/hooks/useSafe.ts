import { useEffect, useRef } from 'react'

export function useSafe() {
  const safeRef = useRef(true)
  useEffect(() => {
    return () => {
      safeRef.current = false
    }
  }, [])
  return safeRef
}
