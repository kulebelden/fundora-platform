import axios, { AxiosError } from 'axios';

/**
 * Requests go to the web origin and are proxied to the API by a Next rewrite
 * (see next.config.mjs). Same-origin means the HttpOnly auth cookies ride along
 * automatically and no token is ever exposed to JavaScript.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiErrorShape {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/** Nest's ValidationPipe returns `message` as an array; flatten it for display. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AxiosError) {
    // With the API down, the Next rewrite proxy answers with a plain-text 5xx
    // rather than a network error; the API itself always replies with JSON.
    const proxyFailed =
      (error.response?.status ?? 0) >= 500 && typeof error.response?.data !== 'object';
    if (error.code === 'ERR_NETWORK' || proxyFailed) {
      return 'Cannot reach the HopeNest API. Check that the service is running.';
    }
    const data = error.response?.data as ApiErrorShape | undefined;
    const message = data?.message;
    if (Array.isArray(message) && message.length) return message.join('. ');
    if (typeof message === 'string' && message) return message;
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.';
    if (error.response?.status === 403) return 'You do not have permission to do that.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 401;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}
