import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type MePayload = {
  id?: number;
  isBanned?: boolean;
};

export async function resolveCurrentUserForWrite(authHeader: string) {
  if (!authHeader) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const meRes = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (!meRes.ok) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const mePayload = (await meRes.json().catch(() => ({}))) as MePayload;
  if (!mePayload.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { mePayload };
}

export async function ensureNotBanned(authHeader: string) {
  const resolved = await resolveCurrentUserForWrite(authHeader);
  if ("error" in resolved) {
    return resolved;
  }

  if (resolved.mePayload.isBanned) {
    return {
      error: NextResponse.json(
        { error: "Bạn đã bị cấm hoạt động trên website." },
        { status: 403 },
      ),
    };
  }

  return { mePayload: resolved.mePayload };
}

