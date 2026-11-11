// Leitner-style spaced repetition.
// Wrong answers go back to box 0 and are due immediately.
// Each correct answer moves the question up one box and pushes its next review further away.
import type { SrsItem } from './store'

const DAY = 864e5
export const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35, 90]

export function schedule(prev: SrsItem | undefined, correct: boolean, now = Date.now()): SrsItem {
  if (!correct) return { box: 0, due: now }
  const box = Math.min((prev?.box ?? 0) + 1, INTERVAL_DAYS.length - 1)
  return { box, due: now + INTERVAL_DAYS[box] * DAY }
}

export function dueIds(srs: Record<string, SrsItem>, now = Date.now()): string[] {
  return Object.entries(srs)
    .filter(([, v]) => v.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([k]) => k)
}

export function nextDue(srs: Record<string, SrsItem>, now = Date.now()): number | undefined {
  const future = Object.values(srs).map((v) => v.due).filter((d) => d > now)
  return future.length ? Math.min(...future) : undefined
}
