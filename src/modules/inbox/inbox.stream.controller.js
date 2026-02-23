import { bus } from '../../realtime/bus.js'

function send(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export function streamInbox(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  send(res, 'hello', { ok: true, userId: req.user?.id })

  const keep = setInterval(() => res.write(': ping\n\n'), 15000)

  const onMsg = (payload) => send(res, 'message.created', payload)

  bus.on('message.created', onMsg)

  req.on('close', () => {
    clearInterval(keep)
    bus.off('message.created', onMsg)
    res.end()
  })
}