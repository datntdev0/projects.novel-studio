export type BackendResponse = { status: number; body: unknown };

export async function fetchBackend(
  port: number,
  route: string,
  headers: Record<string, string> = {},
  method = 'GET',
): Promise<BackendResponse> {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, { method, headers });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
