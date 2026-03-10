import * as service from './time-tracking.service.js'

export async function clock(req, res) {
  const userId = req.user.id
  const { type, deviceId, meta } = req.body

  const result = await service.registerClock({
    userId,
    type,
    deviceId,
    meta
  })

  res.json(result)
}

export async function getToday(req, res) {
  const userId = req.user.id
  const result = await service.getTodaySummary(userId)
  res.json(result)
}

export async function getWorkdays(req, res) {
  const userId = req.user.id
  const { from, to } = req.query

  const result = await service.getWorkdays(userId, from, to)
  res.json(result)
}