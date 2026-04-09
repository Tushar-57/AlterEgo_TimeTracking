import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMinutesAsHoursMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.floor(Number.isFinite(totalMinutes) ? totalMinutes : 0))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  return `${hours}h ${minutes}m`
}

export function formatSecondsAsHoursMinutes(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0))
  const roundedMinutes = Math.round(safeSeconds / 60)

  return formatMinutesAsHoursMinutes(roundedMinutes)
}
