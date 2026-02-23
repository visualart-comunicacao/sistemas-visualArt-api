import multer from 'multer'
import path from 'path'
import fs from 'fs'

const voicesDir = path.join(process.cwd(), 'uploads', 'voices')
fs.mkdirSync(voicesDir, { recursive: true })

export const uploadVoice = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, voicesDir),
    filename: (_req, file, cb) => {
      const safe = Date.now() + '-' + Math.random().toString(16).slice(2)
      const ext = path.extname(file.originalname || '') || '.webm'
      cb(null, `${safe}${ext}`)
    },
  }),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB (ajuste depois)
  },
})