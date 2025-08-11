import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const baseWifi = path.resolve(process.cwd(), 'public', 'pdfs')
    const baseCabin = path.resolve(process.cwd(), 'public', 'pdfs', 'cabin')
    const wifi = fs.existsSync(baseWifi) ? fs.readdirSync(baseWifi).filter(f => f.toLowerCase().endsWith('.pdf')) : []
    const cabin = fs.existsSync(baseCabin) ? fs.readdirSync(baseCabin).filter(f => f.toLowerCase().endsWith('.pdf')) : []
    res.status(200).json({ ok: true, wifi, cabin })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) })
  }
}
