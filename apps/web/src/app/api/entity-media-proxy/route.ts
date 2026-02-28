import { NextRequest, NextResponse } from "next/server";
import { ensureNotBanned } from "../_shared/ban-guard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const queryString = searchParams.toString();

  const res = await fetch(`${API_URL}/api/entity-medias?${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(`Bearer ${token}`);
  if ("error" in guard) return guard.error;

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "upload") {
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/api/entity-medias/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === "reorder") {
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/entity-medias/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(`Bearer ${token}`);
  if ("error" in guard) return guard.error;

  const { searchParams } = request.nextUrl;
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const body = await request.json();

  const res = await fetch(`${API_URL}/api/entity-medias/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(`Bearer ${token}`);
  if ("error" in guard) return guard.error;

  const { searchParams } = request.nextUrl;
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/api/entity-medias/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(`Bearer ${token}`);
  if ("error" in guard) return guard.error;

  const body = await request.json();

  const res = await fetch(`${API_URL}/api/entity-medias/bulk-update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
