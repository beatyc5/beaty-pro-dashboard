import type { NextApiRequest, NextApiResponse } from 'next'

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
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || ''
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const url = `${proto}://${host}${rel}`

    const range = req.headers['range'] as string | undefined
    const headers: Record<string, string> = {}
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

    let resp = await fetch(url, { headers })
    if (!resp.ok && resp.status === 404) {
      // Fallback: fetch from GitHub raw content (handles previews missing static assets)
      const owner = 'beatyc5'
      const repo = 'beaty-pro-dashboard'
      const sha = process.env.VERCEL_GIT_COMMIT_SHA || 'main'
      const ghPath = scope === 'cabin' ? `public/pdfs/cabin/${name}` : `public/pdfs/${name}`
      const ghUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${ghPath}`
      resp = await fetch(ghUrl)
      if (!resp.ok) {
        res.status(404).send('Not found')
        return
      }
    } else if (!resp.ok) {
      // Final fallback: GitHub Contents API with optional token for private repos
      const token = process.env.GITHUB_TOKEN
      if (token) {
        const owner = 'beatyc5'
        const repo = 'beaty-pro-dashboard'
        const sha = process.env.VERCEL_GIT_COMMIT_SHA || 'main'
        const ghPath = scope === 'cabin' ? `public/pdfs/cabin/${name}` : `public/pdfs/${name}`
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(ghPath)}?ref=${sha}`
        const gh = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
        if (gh.ok) {
          const j: any = await gh.json()
          if (j && j.content && j.encoding === 'base64') {
            const buf = Buffer.from(j.content, 'base64')
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Length', String(buf.length))
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            res.status(200)
            res.end(buf)
            return
          }
        }
      }
      res.status(resp.status).send('Not found')
      return
    }
    resp.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-encoding') return
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
