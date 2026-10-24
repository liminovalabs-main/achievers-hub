import { NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  const response = await fetch(`${apiUrl}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json(payload, { status: response.status });

  const nextResponse = NextResponse.json({ user: payload.user });
  nextResponse.cookies.set("ah_session", payload.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
  return nextResponse;
}
