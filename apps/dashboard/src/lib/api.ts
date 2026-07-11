import type { ApiError } from '@modyrn/shared';

/** Thrown when an API request returns a non-2xx response. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Base URL for API calls. In the browser we use relative `/api/v1` (proxied by
 * Next rewrites); on the server we call the API directly.
 */
function baseUrl(): string {
  if (typeof window === 'undefined') {
    return `${process.env.API_URL ?? 'http://localhost:4000'}/api/v1`;
  }
  return '/api/v1';
}

export interface ApiFetchOptions extends RequestInit {
  /** Forwarded cookies for server-side requests. */
  cookie?: string;
}

/**
 * Typed fetch wrapper for the Modyrn API. Sends credentials, parses the JSON
 * body and throws a structured {@link ApiRequestError} on failure.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { cookie, headers, ...rest } = options;
  const res = await fetch(`${baseUrl()}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let body: ApiError;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      body = {
        statusCode: res.status,
        error: res.statusText,
        message: 'Request failed.',
        code: 'REQUEST_FAILED',
      };
    }
    throw new ApiRequestError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
