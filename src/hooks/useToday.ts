import { useEffect, useState } from 'react'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Today's date as an ISO `YYYY-MM-DD` string (UTC, matching the app's other
 * date helpers) that automatically refreshes when the day rolls over. This keeps
 * date-based status badges and D-day countdowns correct even when a page is left
 * open across midnight, without per-page timers.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayIso)

  useEffect(() => {
    const now = new Date()
    const nextRollover = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      5
    )
    const timer = setTimeout(() => setToday(todayIso()), nextRollover - now.getTime())
    return () => clearTimeout(timer)
  }, [today])

  return today
}

export default useToday
