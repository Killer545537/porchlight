const BACKEND_URL =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
        ? process.env.NEXT_PUBLIC_API_URL
        : undefined) ||
    'http://localhost:8000';

type RouteContext = {
    params: Promise<{
        path?: string[];
    }>;
};

async function proxy(request: Request, context: RouteContext) {
    const { path = [] } = await context.params;
    const sourceUrl = new URL(request.url);
    const targetUrl = new URL(`/${path.join('/')}`, BACKEND_URL.replace(/\/$/, ''));
    targetUrl.search = sourceUrl.search;

    const headers = new Headers(request.headers);
    headers.delete('host');

    const method = request.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);

    const response = await fetch(targetUrl, {
        method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: 'manual',
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });
}

export const dynamic = 'force-dynamic';

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
