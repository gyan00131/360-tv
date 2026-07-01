export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  baseUrl?: string;
}

const normalizeBody = (body: unknown, headers: Headers): BodyInit | undefined => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return body as BodyInit;
  }

  if (!headers.has('Content-Type') && !headers.has('content-type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
};

const buildUrl = (path: string, baseUrl?: string) => {
  if (!path) {
    return baseUrl ?? '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = (baseUrl ?? '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers ?? {});
  headers.set('Accept', 'application/json');

  const requestBody = normalizeBody(options.body, headers);
  const response = await fetch(buildUrl(path, options.baseUrl), {
    ...options,
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
};

export const get = <T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
  apiRequest<T>(path, { ...options, method: 'GET' });

export const post = <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
  apiRequest<T>(path, { ...options, method: 'POST', body });

export const put = <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
  apiRequest<T>(path, { ...options, method: 'PUT', body });
