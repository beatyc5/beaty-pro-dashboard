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
    const baseDir = scope === 'cabin'
      ? path.resolve(process.cwd(), 'public', 'pdfs', 'cabin')
      : path.resolve(process.cwd(), 'public', 'pdfs')
    const filePath = path.resolve(baseDir, name)
    if (!filePath.startsWith(baseDir)) {
      res.status(400).send('Bad path')
      return
    }
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Not found')
      return
    }
    const stat = fs.statSync(filePath)
    const range = req.headers.range
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    if (range) {
      const m = /bytes=(\d+)-(\d+)?/.exec(range)
      const start = m ? parseInt(m[1], 10) : 0
      const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1
      const chunkSize = (end - start) + 1
      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
      res.setHeader('Content-Length', String(chunkSize))
      const stream = fs.createReadStream(filePath, { start, end })
      stream.pipe(res)
    } else {
      res.setHeader('Content-Length', String(stat.size))
      const stream = fs.createReadStream(filePath)
      stream.pipe(res)
    }
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error')
  }
}
