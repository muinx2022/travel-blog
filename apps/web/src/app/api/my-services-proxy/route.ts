import { NextResponse } from "next/server";
import {
  resolveEditPath,
  SERVICE_REGISTRY,
} from "@/features/my-services/config/service-registry";
import { ensureNotBanned } from "../_shared/ban-guard";
import type { ServiceType } from "@/features/my-services/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type ServiceItem = {
  documentId: string;
  type: ServiceType;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published";
  editUrl: string;
};

type ServicesMeta = {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  byType: Record<ServiceType, number>;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedType = String(searchParams.get("type") ?? "").trim();
  const documentId = String(searchParams.get("documentId") ?? "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "100", 10);

  try {
    if (requestedType && requestedType in SERVICE_REGISTRY) {
      const type = requestedType as ServiceType;
      const entry = SERVICE_REGISTRY[type];
      const origin = new URL(request.url).origin;
      const target = new URL(`${origin}${entry.apiProxyPath}`);
      target.searchParams.set("page", String(page));
      target.searchParams.set("pageSize", String(pageSize));
      if (documentId) {
        target.searchParams.set("documentId", documentId);
      }

      const proxied = await fetch(target.toString(), {
        headers: { Authorization: authHeader },
        cache: "no-store",
      });
      const proxiedPayload = await proxied.json().catch(() => ({}));
      return NextResponse.json(proxiedPayload, { status: proxied.status });
    }

    const res = await fetch(`${API_URL}/api/my-services?page=${page}&pageSize=${pageSize}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => ({}))) as {
      data?: Array<{
        documentId: string;
        type: ServiceType;
        title: string;
        createdAt: string;
        updatedAt: string;
        status: "draft" | "published";
      }>;
      meta?: ServicesMeta;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(payload.error || "Failed to load services");
    }

    const servicesWithEditUrl = (payload.data ?? []).map((item) => ({
      ...item,
      editUrl: resolveEditPath(item.type, item.documentId),
    }));

    return NextResponse.json({
      data: servicesWithEditUrl,
      meta: payload.meta ?? {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
        byType: {
          post: 0,
          tour: 0,
          hotel: 0,
          homestay: 0,
          restaurant: 0,
          "souvenir-shop": 0,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(authHeader);
  if ("error" in guard) return guard.error;

  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/my-services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string }).error || "Failed to create service" },
        { status: res.status },
      );
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(authHeader);
  if ("error" in guard) return guard.error;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const documentId = String(body.documentId ?? "").trim();

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const { documentId: _ignored, ...data } = body;

    const res = await fetch(`${API_URL}/api/my-services/${documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ data }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string }).error || "Failed to update service" },
        { status: res.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guard = await ensureNotBanned(authHeader);
  if ("error" in guard) return guard.error;

  try {
    const requestUrl = new URL(request.url);
    const queryType = String(requestUrl.searchParams.get("type") ?? "").trim();
    const body = (await request.json()) as {
      documentId?: string;
      type?: ServiceType;
      currentStatus?: "draft" | "published";
    };

    const documentId = String(body.documentId ?? "").trim();
    const type = (body.type ?? queryType) as ServiceType | "";

    if (!documentId || !type) {
      return NextResponse.json(
        { error: "documentId and type are required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_URL}/api/my-services/${documentId}/toggle-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ type, currentStatus: body.currentStatus }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string }).error || "Failed to toggle status" },
        { status: res.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
