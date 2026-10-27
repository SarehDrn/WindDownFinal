// Thin wrapper around fetch for the Wind Down API.

export class ApiError extends Error {
  constructor(status, data) {
    super(errorMessage(data) || `Request failed (${status})`)
    this.status = status
    this.data = data
  }
}

// Turn a DRF error body ({"field": ["msg"], "detail": "msg", ...}) into one string.
export function errorMessage(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.detail === 'string') return data.detail
  return Object.values(data)
    .flat()
    .filter((value) => typeof value === 'string')
    .join(' ')
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Token ${token}`

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}
