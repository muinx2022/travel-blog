import { NextResponse } from "next/server";
import { slugifyVi } from "@/features/my-services/lib/slugify-vi";
import { ensureNotBanned } from "./ban-guard";
import {
  mergeDraftAndPublishedRows,
  paginateRows,
} from "@/features/my-services/lib/status-merge";
import type {
  PublishStatus,
  ServiceRegistryEntry,
} from "@/features/my-services/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type MePayload = { id?: number };

type CategoryLookupPayload = {
  data?: Array<{ id?: number; documentId?: string }>;
};

type GenericRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  status?: PublishStatus;
  [key: string]: unknown;
};

type ErrorResult = {
  error: ReturnType<typeof NextResponse.json>;
};

type RowsResult<Row extends GenericRow> = {
  rows: Row[];
};

type OwnedRowResult<Row extends GenericRow> = {
  row: Row;
};

type ProxyOptions<Row extends GenericRow> = {
  entry: ServiceRegistryEntry;
  resourceLabel: string;
  createTransform?: (body: Record<string, unknown>) => Record<string, unknown>;
  updateTransform?: (body: Record<string, unknown>) => Record<string, unknown>;
  loadFailureMessage: string;
  createFailureMessage: string;
  updateFailureMessage: string;
  toggleFailureMessage: string;
};

function payloadErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const objectPayload = payload as {
    error?: string | { message?: string };
  };

  if (typeof objectPayload.error === "string") {
    return objectPayload.error;
  }

  if (typeof objectPayload.error?.message === "string") {
    return objectPayload.error.message;
  }

  return fallback;
}

async function resolveCurrentUser(authHeader: string) {
  const meRes = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (!meRes.ok) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const mePayload = (await meRes.json().catch(() => ({}))) as MePayload;
  if (!mePayload.id) {
    return {
      error: NextResponse.json({ error: "Cannot resolve current user" }, { status: 400 }),
    };
  }

  return { mePayload };
}

async function fetchRowsByStatus<Row extends GenericRow>(
  authHeader: string,
  entry: ServiceRegistryEntry,
  status: PublishStatus,
): Promise<RowsResult<Row> | ErrorResult> {
  const query = new URLSearchParams({
    status,
    "pagination[page]": "1",
    "pagination[pageSize]": "1000",
  });

  const res = await fetch(
    `${API_URL}/api/${entry.entityEndpoint}/${entry.myEndpoint}?${query.toString()}`,
    {
      headers: { Authorization: authHeader },
      cache: "no-store",
    },
  );

  const payload = (await res.json().catch(() => ({}))) as {
    data?: Row[];
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      error: NextResponse.json(
        { error: payload.error?.message ?? "Fetch failed" },
        { status: res.status },
      ),
    };
  }

  const rows = (payload.data ?? []).map((item) => ({
    ...item,
    status,
    publishedAt: status === "published" ? item.publishedAt ?? null : null,
  })) as Row[];

  return { rows };
}

async function fetchOwnedRow<Row extends GenericRow>(
  authHeader: string,
  entry: ServiceRegistryEntry,
  documentId: string,
  resourceLabel: string,
): Promise<OwnedRowResult<Row> | ErrorResult> {
  const [publishedResult, draftResult] = await Promise.all([
    fetchRowsByStatus<Row>(authHeader, entry, "published"),
    fetchRowsByStatus<Row>(authHeader, entry, "draft"),
  ]);

  if ("error" in publishedResult) return { error: publishedResult.error };
  if ("error" in draftResult) return { error: draftResult.error };

  const mergedRows = mergeDraftAndPublishedRows(
    draftResult.rows,
    publishedResult.rows,
  );
  const matched = mergedRows.find((row) => row.documentId === documentId);

  if (!matched?.documentId) {
    return {
      error: NextResponse.json(
        { error: `${resourceLabel} not found` },
        { status: 404 },
      ),
    };
  }

  return { row: matched };
}

async function resolveCategoryIds(authHeader: string, categoryDocumentIds: string[]) {
  if (categoryDocumentIds.length === 0) {
    return [];
  }

  const query = new URLSearchParams({
    "fields[0]": "id",
    "fields[1]": "documentId",
    "pagination[page]": "1",
    "pagination[pageSize]": String(Math.max(20, categoryDocumentIds.length * 2)),
  });

  categoryDocumentIds.forEach((documentId, index) => {
    query.append(`filters[documentId][$in][${index}]`, documentId);
  });

  const res = await fetch(`${API_URL}/api/categories?${query.toString()}`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as CategoryLookupPayload;
  if (!res.ok) {
    return [];
  }

  return (payload.data ?? [])
    .map((item) => item.id)
    .filter((id): id is number => Number.isFinite(id));
}

async function publishDocument(authHeader: string, entry: ServiceRegistryEntry, documentId: string) {
  const tryPaths = [
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/user-publish`,
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/actions/publish`,
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/publish`,
  ];

  for (const path of tryPaths) {
    const res = await fetch(path, {
      method: "POST",
      headers: { Authorization: authHeader },
    });

    if (res.ok) {
      return true;
    }
  }

  const fallbackRes = await fetch(`${API_URL}/api/${entry.entityEndpoint}/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
  });

  return fallbackRes.ok;
}

async function unpublishDocument(authHeader: string, entry: ServiceRegistryEntry, documentId: string) {
  const tryPaths = [
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/user-unpublish`,
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/actions/unpublish`,
    `${API_URL}/api/${entry.entityEndpoint}/${documentId}/unpublish`,
  ];

  for (const path of tryPaths) {
    const res = await fetch(path, {
      method: "POST",
      headers: { Authorization: authHeader },
    });

    if (res.ok) {
      return true;
    }
  }

  const fallbackRes = await fetch(`${API_URL}/api/${entry.entityEndpoint}/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ data: { publishedAt: null } }),
  });

  return fallbackRes.ok;
}

export function createMyServiceProxyHandlers<Row extends GenericRow>(
  options: ProxyOptions<Row>,
) {
  const {
    entry,
    resourceLabel,
    createTransform,
    updateTransform,
    loadFailureMessage,
    createFailureMessage,
    updateFailureMessage,
    toggleFailureMessage,
  } = options;

  return {
    GET: async (request: Request) => {
      const authHeader = request.headers.get("Authorization") ?? "";
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
      const documentId = String(searchParams.get("documentId") ?? "").trim();

      try {
        const resolved = await resolveCurrentUser(authHeader);
        if ("error" in resolved) return resolved.error;

        if (documentId) {
          const owned = await fetchOwnedRow<Row>(
            authHeader,
            entry,
            documentId,
            resourceLabel,
          );
          if ("error" in owned) return owned.error;
          return NextResponse.json({ data: owned.row });
        }

        const [publishedResult, draftResult] = await Promise.all([
          fetchRowsByStatus<Row>(authHeader, entry, "published"),
          fetchRowsByStatus<Row>(authHeader, entry, "draft"),
        ]);

        if ("error" in publishedResult) return publishedResult.error;
        if ("error" in draftResult) return draftResult.error;

        const mergedRows = mergeDraftAndPublishedRows(
          draftResult.rows,
          publishedResult.rows,
        );

        const paginated = paginateRows(mergedRows, page, pageSize);
        return NextResponse.json(paginated);
      } catch {
        return NextResponse.json({ error: loadFailureMessage }, { status: 500 });
      }
    },

    POST: async (request: Request) => {
      const authHeader = request.headers.get("Authorization") ?? "";
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const guard = await ensureNotBanned(authHeader);
      if ("error" in guard) return guard.error;

      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      const title = String(body.title ?? "").trim();
      const content = String(body.content ?? "").trim();
      const categoryDocumentIds = Array.isArray(body.categories)
        ? body.categories.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];

      if (!title || !content || content === "<p></p>") {
        return NextResponse.json(
          { error: "Title and content are required" },
          { status: 400 },
        );
      }

      try {
        const resolved = await resolveCurrentUser(authHeader);
        if ("error" in resolved) return resolved.error;

        const baseSlug = slugifyVi(title) || `${entry.slugPrefix}-${Date.now()}`;
        const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
        const categoryIds = await resolveCategoryIds(authHeader, categoryDocumentIds);

        const createRes = await fetch(
          `${API_URL}/api/${entry.entityEndpoint}/user-create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              data: {
                title,
                slug,
                content,
                categories: categoryIds,
                ...(createTransform ? createTransform(body) : {}),
              },
            }),
          },
        );

        const createPayload = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return NextResponse.json(
            {
              error: payloadErrorMessage(createPayload, "Create failed"),
            },
            { status: createRes.status },
          );
        }

        return NextResponse.json(createPayload, { status: 201 });
      } catch {
        return NextResponse.json({ error: createFailureMessage }, { status: 500 });
      }
    },

    PUT: async (request: Request) => {
      const authHeader = request.headers.get("Authorization") ?? "";
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const guard = await ensureNotBanned(authHeader);
      if ("error" in guard) return guard.error;

      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      const documentId = String(body.documentId ?? "").trim();
      const title = String(body.title ?? "").trim();
      const content = String(body.content ?? "").trim();
      const categoryDocumentIds = Array.isArray(body.categories)
        ? body.categories.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];

      if (!documentId || !title || !content || content === "<p></p>") {
        return NextResponse.json(
          { error: "documentId, title and content are required" },
          { status: 400 },
        );
      }

      try {
        const resolved = await resolveCurrentUser(authHeader);
        if ("error" in resolved) return resolved.error;

        const owned = await fetchOwnedRow<Row>(
          authHeader,
          entry,
          documentId,
          resourceLabel,
        );
        if ("error" in owned) return owned.error;

        const categoryIds = await resolveCategoryIds(authHeader, categoryDocumentIds);

        const updateRes = await fetch(
          `${API_URL}/api/${entry.entityEndpoint}/${documentId}/user-update`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              data: {
                title,
                content,
                categories: categoryIds,
                ...(updateTransform ? updateTransform(body) : {}),
              },
            }),
          },
        );

        const updatePayload = (await updateRes.json().catch(() => ({}))) as {
          data?: Row;
          error?: { message?: string };
        };

        if (!updateRes.ok) {
          return NextResponse.json(
            {
              error: updatePayload.error?.message ?? "Update failed",
            },
            { status: updateRes.status },
          );
        }

        const refreshed = await fetchOwnedRow<Row>(
          authHeader,
          entry,
          owned.row.documentId ?? documentId,
          resourceLabel,
        );

        if ("error" in refreshed) {
          return NextResponse.json(updatePayload);
        }

        return NextResponse.json({ data: refreshed.row });
      } catch {
        return NextResponse.json({ error: updateFailureMessage }, { status: 500 });
      }
    },

    PATCH: async (request: Request) => {
      const authHeader = request.headers.get("Authorization") ?? "";
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const guard = await ensureNotBanned(authHeader);
      if ("error" in guard) return guard.error;

      const body = (await request.json().catch(() => ({}))) as {
        documentId?: string;
        action?: "toggle" | "publish" | "unpublish";
        currentStatus?: PublishStatus;
      };

      const documentId = String(body.documentId ?? "").trim();
      if (!documentId) {
        return NextResponse.json({ error: "documentId is required" }, { status: 400 });
      }

      try {
        const resolved = await resolveCurrentUser(authHeader);
        if ("error" in resolved) return resolved.error;

        const owned = await fetchOwnedRow<Row>(
          authHeader,
          entry,
          documentId,
          resourceLabel,
        );
        if ("error" in owned) return owned.error;

        const currentStatus = body.currentStatus ?? owned.row.status ?? "draft";
        const shouldPublish =
          body.action === "publish" ||
          (body.action !== "unpublish" && currentStatus !== "published");

        const ok = shouldPublish
          ? await publishDocument(authHeader, entry, documentId)
          : await unpublishDocument(authHeader, entry, documentId);

        if (!ok) {
          return NextResponse.json(
            { error: `Cannot change ${resourceLabel.toLowerCase()} status` },
            { status: 400 },
          );
        }

        const refreshed = await fetchOwnedRow<Row>(
          authHeader,
          entry,
          documentId,
          resourceLabel,
        );
        if ("error" in refreshed) return refreshed.error;

        return NextResponse.json({ data: refreshed.row });
      } catch {
        return NextResponse.json({ error: toggleFailureMessage }, { status: 500 });
      }
    },
  };
}

