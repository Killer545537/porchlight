// Thin fetch wrapper around the Porchlight FastAPI backend.
//
// The backend runs separately (uvicorn, default :8000). Set NEXT_PUBLIC_API_URL
// to point elsewhere; otherwise we assume localhost:8000.

export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const TOKEN_KEY = 'porchlight.token';

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
}

// Turn a backend-relative asset path (e.g. "/static/uploads/x.jpg") into an
// absolute URL the browser can load from the API host.
export function assetUrl(path: string): string {
    if (!path) return path;
    if (/^https?:\/\//.test(path)) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class ApiError extends Error {
    status: number;
    detail: unknown;
    constructor(status: number, message: string, detail?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

interface RequestOptions {
    method?: string;
    // JSON body — serialized automatically.
    body?: unknown;
    // Raw body (FormData / URLSearchParams) — sent as-is, no JSON header.
    raw?: BodyInit;
    query?: Record<string, string | number | boolean | undefined | null>;
    auth?: boolean;
}

function buildQuery(query?: RequestOptions['query']): string {
    if (!query) return '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    }
    const s = params.toString();
    return s ? `?${s}` : '';
}

async function extractError(res: Response): Promise<ApiError> {
    let detail: unknown;
    let message = `${res.status} ${res.statusText}`;
    try {
        const data = await res.json();
        detail = data?.detail ?? data;
        if (typeof data?.detail === 'string') {
            message = data.detail;
        } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
            // FastAPI validation errors: [{ loc, msg, type }]
            message = data.detail[0].msg;
        }
    } catch {
        /* body wasn't JSON — keep the status line */
    }
    return new ApiError(res.status, message, detail);
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, raw, query, auth = false } = options;
    const headers: Record<string, string> = {};

    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let payload: BodyInit | undefined;
    if (raw !== undefined) {
        payload = raw;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
        method,
        headers,
        body: payload,
    });

    if (!res.ok) throw await extractError(res);
    if (res.status === 204) return undefined as T;

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
}
