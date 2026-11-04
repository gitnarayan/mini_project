const backendUrl = () => {
  const value = process.env.BACKEND_URL;
  if (!value) return 'http://127.0.0.1:4000';
  return value.replace(/\/$/, '');
};

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`/api/${path.join('/')}${new URL(request.url).search}`, backendUrl());

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-length');
    responseHeaders.delete('content-encoding');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API proxy failed', error);
    return Response.json(
      { message: 'Unable to reach the API service' },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
