import { prisma } from '../../db/prisma.js'
import { calculateWorkday } from './time-tracking.calc.js'

function normalizeDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function registerClock({ userId, type, deviceId, meta }) {
  const now = new Date()

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      type,
      timestamp: now,
      deviceId,
      meta
    }
  })

  await recomputeWorkday(userId, now)

  return entry
}

async function recomputeWorkday(userId, date) {
  const dayStart = normalizeDate(date)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const punches = await prisma.timeEntry.findMany({
    where: {
      userId,
      timestamp: {
        gte: dayStart,
        lt: dayEnd
      }
    },
    orderBy: { timestamp: 'asc' }
  })

  const summary = calculateWorkday(punches)

  await prisma.workDay.upsert({
    where: {
      userId_date: {
        userId,
        date: dayStart
      }
    },
    update: summary,
    create: {
      userId,
      date: dayStart,
      ...summary
    }
  })
}

export async function getTodaySummary(userId) {
  const today = normalizeDate(new Date())

  return prisma.workDay.findUnique({
    where: {
      userId_date: {
        userId,
        date: today
      }
    }
  })
}

export async function getWorkdays(userId, from, to) {
  return prisma.workDay.findMany({
    where: {
      userId,
      date: {
        gte: new Date(from),
        lte: new Date(to)
      }
    },
    orderBy: { date: 'desc' }
  })
}