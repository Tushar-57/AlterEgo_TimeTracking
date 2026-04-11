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

const DATE_TIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|[+-]\d{2}:?\d{2})?$/

export function parseDateTimeAsLocal(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  const normalized = value?.trim()
  if (!normalized) {
    return new Date(Number.NaN)
  }

  const match = normalized.match(DATE_TIME_LOCAL_PATTERN)
  if (match) {
    const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw = '0', msRaw = '0'] = match
    const milliseconds = Number(msRaw.padEnd(3, '0').slice(0, 3))
    return new Date(
      Number(yearRaw),
      Number(monthRaw) - 1,
      Number(dayRaw),
      Number(hourRaw),
      Number(minuteRaw),
      Number(secondRaw),
      milliseconds
    )
  }

  return new Date(normalized)
}
