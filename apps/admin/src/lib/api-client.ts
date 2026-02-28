"use client";

import { clearSession, getStoredSession } from "@/lib/admin-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

// Types will be moved here from admin-api.ts as part of the refactoring
// For now, let's define what we need for the generic client.

export type PaginationMeta = {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
};

export type PaginatedResult<T> = {
    data: T[];
    pagination: PaginationMeta;
};

type ApiResponse<T> = { data: T } | T;

function toArray<T>(payload: ApiResponse<T[] | { data: T[] }>): T[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object" && "data" in payload) {
      const data = (payload as { data: unknown }).data;
      if (Array.isArray(data)) {
        return data as T[];
      }
      if (data && typeof data === "object" && "data" in data) {
        const nested = (data as { data?: unknown }).data;
        if (Array.isArray(nested)) {
          return nested as T[];
        }
      }
    }
    return [];
  }

function toItem<T>(payload: ApiResponse<T>): T {
    if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

function toPagination(
    payload: unknown,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    total = 0,
): PaginationMeta {
    if (payload && typeof payload === "object" && "meta" in payload) {
        const meta = (payload as { meta?: unknown }).meta;
        if (meta && typeof meta === "object" && "pagination" in meta) {
            const pagination = (meta as { pagination?: Partial<PaginationMeta> }).pagination;
            if (pagination) {
                const resolvedTotal = Number.isFinite(pagination.total) ? Number(pagination.total) : total;
                const resolvedPageSize = Number.isFinite(pagination.pageSize)
                    ? Number(pagination.pageSize)
                    : pageSize;
                const resolvedPage = Number.isFinite(pagination.page) ? Number(pagination.page) : page;
                const resolvedPageCount = Number.isFinite(pagination.pageCount)
                    ? Number(pagination.pageCount)
                    : Math.max(1, Math.ceil((resolvedTotal || 0) / Math.max(1, resolvedPageSize)));

                return {
                    page: resolvedPage,
                    pageSize: resolvedPageSize,
                    pageCount: resolvedPageCount,
                    total: resolvedTotal,
                };
            }
        }
    }

    return {
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
        total,
    };
}

function toPaginated<T>(
    payload: unknown,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
    const data = toArray<T>(payload as ApiResponse<T[] | { data: T[] }>);
    return {
        data,
        pagination: toPagination(payload, page, pageSize, data.length),
    };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const session = getStoredSession();
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(session?.jwt ? { Authorization: `Bearer ${session.jwt}` } : {}),
            ...(init?.headers ?? {}),
        },
    });

    const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string; name?: string };
    } & T;

    if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
            clearSession();
            window.location.replace("/");
        }
        throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
    }

    return payload;
}

export function createApiClient<TItem, TInput>(resource: string) {
    const resourceUrl = `/api/management/${resource}`;

    return {
        list: async (page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, filters?: any) => {
            const query = new URLSearchParams({
                sort: "updatedAt:desc",
                "pagination[page]": String(page),
                "pagination[pageSize]": String(pageSize),
                ...filters,
            });
            const payload = await request(`${resourceUrl}?${query.toString()}`);
            return toPaginated<TItem>(payload, page, pageSize);
        },
        get: async (documentId: string, populate?: string | string[]) => {
            const query = new URLSearchParams();
            if (populate) {
                if (Array.isArray(populate)) {
                    populate.forEach(p => query.append('populate', p));
                } else {
                    query.set('populate', populate);
                }
            }
            const payload = await request<ApiResponse<TItem>>(`${resourceUrl}/${documentId}?${query.toString()}`);
            return toItem<TItem>(payload);
        },
        create: async (input: TInput) => {
            const payload = await request<ApiResponse<TItem>>(resourceUrl, {
                method: 'POST',
                body: JSON.stringify({ data: input }),
            });
            return toItem<TItem>(payload);
        },
        update: async (documentId: string, input: TInput) => {
            const payload = await request<ApiResponse<TItem>>(`${resourceUrl}/${documentId}`, {
                method: 'PUT',
                body: JSON.stringify({ data: input }),
            });
            return toItem<TItem>(payload);
        },
        delete: async (documentId: string) => {
            await request(`${resourceUrl}/${documentId}`, { method: 'DELETE' });
        },
        publish: async (documentId: string) => {
            const payload = await request<ApiResponse<TItem>>(`${resourceUrl}/${documentId}/publish`, {
                method: 'POST',
            });
            return toItem<TItem>(payload);
        },
        unpublish: async (documentId: string) => {
            const payload = await request<ApiResponse<TItem>>(`${resourceUrl}/${documentId}/unpublish`, {
                method: 'POST',
            });
            return toItem<TItem>(payload);
        },
    };
}
