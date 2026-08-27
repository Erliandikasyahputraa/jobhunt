async function testDevServer() {
  const routes = ['/login', '/applications', '/dashboard', '/favicon.ico']
  console.log('=== Checking Dev Server Endpoints on http://localhost:3000 ===\n')

  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`)
      console.log(`[${res.status}] ${route} (${res.headers.get('content-type')})`)

      if (res.headers.get('content-type')?.includes('text/html')) {
        const text = await res.text()
        const cssMatches = Array.from(
          text.matchAll(/href="(\/_next\/static\/css\/[^"]+\.css[^"]*)"/g)
        ).map(m => m[1])
        const linkMatches = Array.from(
          text.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)
        ).map(m => m[1])
        console.log(`  -> CSS links found in HTML:`, [...new Set([...cssMatches, ...linkMatches])])

        for (const cssUrl of [...new Set([...cssMatches, ...linkMatches])]) {
          const fullCssUrl = cssUrl.startsWith('http') ? cssUrl : `http://localhost:3000${cssUrl}`
          const cssRes = await fetch(fullCssUrl)
          console.log(
            `     -> [${cssRes.status}] CSS asset: ${cssUrl} (Size: ${cssRes.headers.get('content-length') || 'chunked'} bytes)`
          )
        }
      }
    } catch (err: unknown) {
      console.error(
        `  -> ERROR fetching ${route}:`,
        err instanceof Error ? err.message : String(err)
      )
    }
  }
}

testDevServer()
