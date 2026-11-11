import { useEffect, useState } from 'react'
import { useStore } from './store'

export function useDark() {
  const { state } = useStore()
  const [sys, setSys] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const f = () => setSys(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  const t = state.settings.theme
  return t === 'dark' || (t === 'system' && sys)
}
