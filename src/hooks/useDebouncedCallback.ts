import { useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 500,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return useMemo(
    () =>
      (...args: Args) => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => callbackRef.current(...args), delayMs)
      },
    [delayMs],
  )
}
