import { isNsError, nsError, type NsError } from '@shared/core';

export interface BackendEndpoint {
  port: number;
  token: string;
}

async function readFailure(response: Response): Promise<NsError> {
  const body: unknown = await response.json().catch(() => null);
  return isNsError(body) ? body : nsError('INTERNAL', `Backend responded ${response.status}`);
}

export async function backendRequest<T>(endpoint: BackendEndpoint, method: 'GET' | 'POST', route: string, timeoutMs: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`http://127.0.0.1:${endpoint.port}${route}`, {
      method,
      headers: { 'X-Session-Token': endpoint.token },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw nsError('BACKEND_FAILED', 'Backend request failed', error instanceof Error ? error.name : undefined);
  }
  if (!response.ok) throw await readFailure(response);
  return (await response.json()) as T;
}
