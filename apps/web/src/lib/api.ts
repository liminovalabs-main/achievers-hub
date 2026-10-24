import "server-only";
import { cookies } from "next/headers";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = (await cookies()).get("ah_session")?.value;
  const response = await fetch(`${apiUrl}/v1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(". ")
      : payload?.message ?? "The platform service is unavailable";
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
