import { vi } from 'vitest'

// Build a JSON Response-like object.
export function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (data === undefined ? '' : JSON.stringify(data)),
  }
}

// Install a fetch mock routed by "METHOD /path" keys.
// Each handler receives ({ body, headers, url }) and returns [status, data].
export function mockFetch(routes) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    const path = url.split('?')[0]
    const handler = routes[`${method} ${path}`]
    if (!handler) return jsonResponse(404, { detail: `No mock for ${method} ${path}` })
    const body = options.body ? JSON.parse(options.body) : undefined
    const [status, data] = await handler({ body, headers: options.headers || {}, url })
    return jsonResponse(status, data)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
