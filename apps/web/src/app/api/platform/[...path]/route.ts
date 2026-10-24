import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const token = (await cookies()).get("ah_session")?.value;
  if (!token) return NextResponse.json({ message: "Sign in required" }, { status: 401 });

  const target = new URL(`${apiUrl}/v1/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(target, {
    method: request.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}),
    },
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
