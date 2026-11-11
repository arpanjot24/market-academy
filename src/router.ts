import { useEffect, useState } from 'react'

const current = () => location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  const [path, setPath] = useState(current)
  useEffect(() => {
    const onChange = () => { setPath(current()); window.scrollTo(0, 0) }
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export const go = (path: string) => { location.hash = path }
