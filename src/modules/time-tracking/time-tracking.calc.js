const ENTRY_TARGET = "07:40"
const EXIT_TARGET = "18:00"
const LUNCH_MIN = 90
const EXTRA_BREAK_MIN = 15

function parseTime(baseDate, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  return d
}

export function calculateWorkday(punches) {
  if (!punches.length) return {}

  let workedMs = 0
  let breakMs = 0
  let firstInAt = null
  let lastOutAt = null

  let lastClockIn = null
  let lastBreakStart = null

  for (const p of punches) {
    if (p.type === 'CLOCK_IN') {
      if (!firstInAt) firstInAt = p.timestamp
      lastClockIn = p.timestamp
    }

    if (p.type === 'CLOCK_OUT' && lastClockIn) {
      workedMs += new Date(p.timestamp) - new Date(lastClockIn)
      lastOutAt = p.timestamp
      lastClockIn = null
    }

    if (p.type === 'BREAK_START') {
      lastBreakStart = p.timestamp
    }

    if (p.type === 'BREAK_END' && lastBreakStart) {
      breakMs += new Date(p.timestamp) - new Date(lastBreakStart)
      lastBreakStart = null
    }
  }

  // Extra time calculation
  let extraMs = 0
  if (lastOutAt) {
    const exitTarget = parseTime(lastOutAt, EXIT_TARGET)
    if (new Date(lastOutAt) > exitTarget) {
      extraMs = new Date(lastOutAt) - exitTarget
    }
  }

  return {
    firstInAt,
    lastOutAt,
    workedMs,
    breakMs,
    extraMs
  }
}