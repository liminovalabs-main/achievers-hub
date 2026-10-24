export async function browserApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | ({ message?: string | string[] } & T)
    | null;

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(". ")
      : payload?.message ?? "Something went wrong";
    throw new Error(message);
  }
  return payload as T;
}
