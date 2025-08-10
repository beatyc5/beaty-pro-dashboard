// src/pages/_app.tsx
import React from 'react'
import type { AppProps } from 'next/app'
import '../app/globals.css'
// Early bootstrap to initialize Supabase singleton and tracing before any page code
import '../lib/supabaseBootstrap'

function MyApp({ Component, pageProps }: AppProps): React.ReactElement {
  return <Component {...pageProps} />
}

export default MyApp
