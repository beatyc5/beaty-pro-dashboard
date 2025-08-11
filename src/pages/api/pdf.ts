import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    responseLimit: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const name = String(req.query.name || '')
    const scope = String(req.query.scope || 'wifi') // 'wifi' or 'cabin'
    if (!name || !/^[A-Za-z0-9_\-.]+\.pdf$/.test(name)) {
      res.status(400).send('Bad request')
      return
    }
    const base = scope === 'cabin' ? path.join(process.cwd(), 'public', 'pdfs', 'cabin') : path.join(process.cwd(), 'public', 'pdfs')
    const filePath = path.join(base, name)
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Not found')
      return
    }
    const stat = fs.statSync(filePath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', stat.size.toString())
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error')
  }
}
