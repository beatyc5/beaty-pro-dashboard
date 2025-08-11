import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const name = String(req.query.name || '').replace(/\.+/g, '.')
    const scope = String(req.query.scope || 'wifi') // 'wifi' or 'cabin'
    if (!name || !name.endsWith('.pdf')) {
      res.status(400).json({ ok: false, error: 'name query param required (e.g., DK_07.pdf)' })
      return
    }
    const base = scope === 'cabin' ? path.join(process.cwd(), 'public', 'pdfs', 'cabin') : path.join(process.cwd(), 'public', 'pdfs')
    const target = path.join(base, name)
    const exists = fs.existsSync(target)
    let size = 0
    if (exists) {
      try { size = fs.statSync(target).size } catch {}
    }
    res.status(200).json({ ok: true, exists, size, path: target })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) })
  }
}
