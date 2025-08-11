import type { NextApiRequest, NextApiResponse } from 'next'
// Proxy PDFs from Next static /pdfs route instead of reading filesystem

export const config = {
  api: {
    responseLimit: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const name = String(req.query.name || '')
    const scope = String(req.query.scope || 'wifi') // 'wifi' or 'cabin'
    if (!name || !/^[A-Za-z0-9_\-.]+\.pdf$/.test(name)) {
      res.status(400).send('Bad request')
      return
    }
    const rel = scope === 'cabin' ? `/pdfs/cabin/${encodeURIComponent(name)}` : `/pdfs/${encodeURIComponent(name)}`
    const host = req.headers['x-forwarded-host'] || req.headers.host || ''
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const url = `${proto}://${host}${rel}`

    const range = req.headers['range'] as string | undefined
    const headers: Record<string, string> = { }
    if (range) headers['Range'] = range
    const cookie = req.headers['cookie'] as string | undefined
    if (cookie) headers['Cookie'] = cookie
    const auth = req.headers['authorization'] as string | undefined
    if (auth) headers['Authorization'] = auth
    const ua = req.headers['user-agent'] as string | undefined
    if (ua) headers['User-Agent'] = ua
    const accept = req.headers['accept'] as string | undefined
    if (accept) headers['Accept'] = accept
    const referer = req.headers['referer'] as string | undefined
    if (referer) headers['Referer'] = referer
    const vercelBypass = req.headers['x-vercel-protection-bypass'] as string | undefined
    if (vercelBypass) headers['x-vercel-protection-bypass'] = vercelBypass
    const prerenderBypass = req.headers['x-prerender-bypass'] as string | undefined
    if (prerenderBypass) headers['x-prerender-bypass'] = prerenderBypass

    const resp = await fetch(url, { headers })
    if (!resp.ok) {
      res.status(resp.status).send('Not found')
      return
    }
    resp.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-encoding') return // avoid double encoding
      res.setHeader(k, v)
    })
    res.status(resp.status)
    const readable = resp.body as any
    if (readable && typeof readable.pipe === 'function') {
      readable.pipe(res)
    } else {
      const buf = Buffer.from(await resp.arrayBuffer())
      res.end(buf)
    }
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error')
  }
}
