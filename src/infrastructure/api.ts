import ky from 'ky'
import { z } from 'zod'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function resolveBaseUrl(): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL

  if (/^https?:\/\//i.test(base)) {
    return base
  }

  const origin = typeof window === 'undefined' ? 'http://localhost' : globalThis.location.origin

  return new URL(base || '/', origin).toString().replace(/\/$/, '')
}

const RESOLVED_API_BASE_URL = resolveBaseUrl()

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

interface KyRequestConfig extends Omit<RequestOptions, 'headers'> {
  url: string
  headers: Record<string, string>
}

type RequestInterceptor = (config: KyRequestConfig) => KyRequestConfig
type ResponseInterceptor = (response: Response) => Response | Promise<Response>

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []

const apiClient = ky.create({
  throwHttpErrors: false,
  timeout: 10000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

function toHeaderRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}

function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor)
  return () => {
    const index = requestInterceptors.indexOf(interceptor)
    if (index > -1) {
      requestInterceptors.splice(index, 1)
    }
  }
}

function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor)
  return () => {
    const index = responseInterceptors.indexOf(interceptor)
    if (index > -1) {
      responseInterceptors.splice(index, 1)
    }
  }
}

function normalizeRequestConfig(endpoint: string, options: RequestOptions = {}): KyRequestConfig {
  const { params, headers, body, method, ...base } = options
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const fullUrl = normalizedEndpoint
    ? `${RESOLVED_API_BASE_URL}/${normalizedEndpoint}`
    : RESOLVED_API_BASE_URL

  return {
    ...base,
    url: fullUrl,
    method: method ?? 'GET',
    params,
    headers: {
      'Content-Type': 'application/json',
      ...toHeaderRecord(headers),
    },
    body,
  }
}

function addInterceptors(config: KyRequestConfig): KyRequestConfig {
  let requestConfig = config
  for (const interceptor of requestInterceptors) {
    requestConfig = interceptor(requestConfig)
  }
  return requestConfig
}

async function applyResponseInterceptors(response: Response): Promise<Response> {
  let result = response
  for (const interceptor of responseInterceptors) {
    result = await interceptor(result)
  }
  return result
}

function serializeBody(body: unknown) {
  return body === undefined ? undefined : JSON.stringify(body)
}

function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const mergedConfig = addInterceptors(normalizeRequestConfig(endpoint, options))
  const { url, headers, params, body, ...rest } = mergedConfig
  const shouldHaveBody = mergedConfig.method !== 'GET' && mergedConfig.method !== 'HEAD'

  return apiClient(url, {
    ...rest,
    headers,
    method: mergedConfig.method,
    searchParams: params,
    ...(shouldHaveBody ? { body } : {}),
  })
    .then(async (response) => {
      const intercepted = await applyResponseInterceptors(response)

      if (!intercepted.ok) {
        throw new ApiError(intercepted.status, `HTTP error! status: ${intercepted.status}`)
      }

      if (intercepted.status === 204 || intercepted.headers.get('content-length') === '0') {
        return { data: null as T, status: intercepted.status }
      }

      return {
        data: (await intercepted.json()) as T,
        status: intercepted.status,
      }
    })
    .catch((error) => {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(0, error instanceof Error ? error.message : 'Network error')
    })
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'GET' })
  },

  getValidated<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.get<unknown>(endpoint, options).then((res) => {
      const parsed = schema.safeParse(res.data)
      if (!parsed.success) {
        console.error(`[API Validation Error] ${endpoint}:`, parsed.error)
        throw new ApiError(res.status, `Data validation error! ${parsed.error.message}`)
      }
      return { ...res, data: parsed.data }
    })
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: serializeBody(body),
    })
  },

  postValidated<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodType<T>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.post<unknown>(endpoint, body, options).then((res) => {
      const parsed = schema.safeParse(res.data)
      if (!parsed.success) {
        console.error(`[API Validation Error] ${endpoint}:`, parsed.error)
        throw new ApiError(res.status, `Data validation error! ${parsed.error.message}`)
      }
      return { ...res, data: parsed.data }
    })
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: serializeBody(body),
    })
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: serializeBody(body),
    })
  },

  delete<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  },
}

export { ApiError, addRequestInterceptor, addResponseInterceptor }
export default api
