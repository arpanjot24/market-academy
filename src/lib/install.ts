import { useEffect, useState } from 'react'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: BIPEvent | null = null
const listeners = new Set<() => void>()
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; listeners.forEach((f) => f()) })
addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()) })

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches

export function useInstallPrompt() {
  const [, force] = useState(0)
  useEffect(() => { const f = () => force((x) => x + 1); listeners.add(f); return () => { listeners.delete(f) } }, [])
  return {
    canInstall: !!deferred && !isStandalone(),
    prompt: async () => { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; deferred = null; listeners.forEach((f) => f()) },
  }
}
