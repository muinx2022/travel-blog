import { NextResponse } from "next/server";
import { ensureNotBanned } from "../_shared/ban-guard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(authHeader);
  if ("error" in guard) return guard.error;

  const body = await request.json();
  const endpoint =
    body?.mode === "contact" || body?.actionType === "contact"
      ? "/api/interactions/contact"
      : "/api/interactions/toggle";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "Cannot connect to API" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetDocumentId = searchParams.get("targetDocumentId");
  const authHeader = request.headers.get("Authorization") ?? "";

  if (!authHeader || !targetType) {
    return NextResponse.json({ liked: false, followed: false, reported: false });
  }

  let query = `/api/interactions/mine?targetType=${encodeURIComponent(targetType)}`;
  if (targetDocumentId) {
    query += `&targetDocumentId=${encodeURIComponent(targetDocumentId)}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${query}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ liked: false, followed: false, reported: false });
  }

  if (!res.ok) {
    return NextResponse.json({ liked: false, followed: false, reported: false });
  }

  const data = await res.json();
  const interactions: { actionType: string; targetDocumentId?: string }[] = data?.data ?? [];

  if (!targetDocumentId) {
    return NextResponse.json({ data: interactions });
  }

  return NextResponse.json({
    liked: interactions.some((i) => i.actionType === "like"),
    followed: interactions.some((i) => i.actionType === "follow"),
    reported: interactions.some((i) => i.actionType === "report"),
  });
}
