"use client";

import { clearSession, getStoredSession } from "@/lib/admin-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

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

export type PostItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  tags?: Array<Pick<TagItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  categoriesCount?: number;
  commentsCount?: number;
};

export type PostInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  categories?: string[];
  tags?: string[];
  author?: number | null;
};

export type CategoryItem = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  parent?: { id: number; documentId: string; name: string } | null;
};

export type CategoryInput = {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  parent?: string | null;
};

export type CommentTargetType = "post" | "page" | "product" | "hotel" | "tour" | "other";

export type CommentItem = {
  id: number;
  documentId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  targetType: CommentTargetType;
  targetDocumentId: string;
  targetTitle?: string;
  parent?: {
    id?: number;
    documentId: string;
    authorName?: string;
    targetType?: CommentTargetType;
    targetDocumentId?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type RoleItem = {
  id: number;
  name: string;
  type?: string;
  description?: string;
};

export type ActionItem = {
  resource: string;
  action: string;
  actionString: string;
};

export type PermissionMap = Record<string, Record<string, boolean>>;

export type UserItem = {
  id: number;
  username: string;
  email: string;
  blocked: boolean;
  confirmed: boolean;
  isBanned?: boolean;
  banReason?: string;
  role?: RoleItem | null;
};

export type AdminDashboardData = {
  totals: {
    posts: number | null;
    tours: number | null;
    hotels: number | null;
    categories: number | null;
    comments: number | null;
    tags: number | null;
    homestays: number | null;
    restaurants: number | null;
    souvenirShops: number | null;
    travelGuides: number | null;
  };
  recent: {
    posts: Array<Pick<PostItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    tours: Array<Pick<TourItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    hotels: Array<Pick<HotelItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    categories: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug"> & { updatedAt?: string }>;
    comments: Array<
      Pick<CommentItem, "id" | "documentId" | "authorName" | "content" | "targetType" | "targetDocumentId"> & {
        updatedAt?: string;
      }
    >;
    tags: Array<Pick<TagItem, "id" | "documentId" | "name" | "slug"> & { updatedAt?: string }>;
    homestays: Array<Pick<HomestayItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    restaurants: Array<Pick<RestaurantItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    souvenirShops: Array<Pick<SouvenirShopItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
    travelGuides: Array<Pick<TravelGuideItem, "id" | "documentId" | "title" | "slug" | "updatedAt">>;
  };
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
    // Only clear session on 401 (token invalid/expired), not on 403 (insufficient permissions)
    if (response.status === 401 && typeof window !== "undefined") {
      clearSession();
      window.location.replace("/");
    }

    throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  }

  return payload;
}

export const postsApi = createApiClient<PostItem, PostInput>("posts");

export const {
  list: listPosts,
  get: getPost,
  create: createPost,
  update: updatePost,
  delete: deletePost,
  publish: publishPost,
  unpublish: unpublishPost,
} = postsApi;

export const categoriesApi = createApiClient<CategoryItem, CategoryInput>("categories");

export async function listAllCategories() {
  const result = await categoriesApi.list(1, 1000, { sort: "sortOrder:asc" });
  return result.data;
}

export async function reorderCategory(
  draggedId: number,
  targetId: number | null,
  position: "child" | "after" | "root",
) {
  const body: { draggedId: number; position: "child" | "after" | "root"; targetId?: number } = {
    draggedId,
    position,
  };
  if (typeof targetId === "number") {
    body.targetId = targetId;
  }

  await request("/api/management/categories/reorder", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const {
  list: listCategories,
  get: getCategory,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
  publish: publishCategory,
  unpublish: unpublishCategory,
} = categoriesApi;

export const commentsApi = createApiClient<CommentItem, Partial<CommentItem>>("comments");

export async function listCommentsForTarget(
  targetType: CommentTargetType,
  targetDocumentId: string,
) {
  const result = await commentsApi.list(1, 200, {
    sort: "createdAt:asc",
    "filters[targetType][$eq]": targetType,
    "filters[targetDocumentId][$eq]": targetDocumentId,
  });
  return { ...result, pagination: { ...result.pagination, pageCount: 1 } };
}

export const {
  list: listComments,
  get: getComment,
  create: createComment,
  update: updateComment,
  delete: deleteComment,
  publish: publishComment,
  unpublish: unpublishComment,
} = commentsApi;

export async function listUsers(page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, q = "") {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(q.trim() ? { q: q.trim() } : {}),
  });
  const payload = await request(`/api/management/users?${query.toString()}`);
  return toPaginated<UserItem>(payload, page, pageSize);
}

export async function getUser(id: number) {
  const payload = await request<ApiResponse<UserItem>>(`/api/management/users/${id}`);
  return toItem<UserItem>(payload);
}

export async function listRoles() {
  const payload = await request<ApiResponse<RoleItem[]>>("/api/management/roles");
  return toArray<RoleItem>(payload);
}

export async function createRole(input: { name: string; description?: string }) {
  const payload = await request<ApiResponse<RoleItem>>("/api/management/roles", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<RoleItem>(payload);
}

export async function updateRole(id: number, input: { name?: string; description?: string }) {
  const payload = await request<ApiResponse<RoleItem>>(`/api/management/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<RoleItem>(payload);
}

export async function deleteRole(id: number) {
  await request(`/api/management/roles/${id}`, { method: "DELETE" });
}

export async function getAvailableActions() {
  const payload = await request<ApiResponse<ActionItem[]>>("/api/management/available-actions");
  return toArray<ActionItem>(payload);
}

export async function getRolePermissions(roleId: number) {
  const payload = await request<ApiResponse<PermissionMap>>(`/api/management/roles/${roleId}/permissions`);
  return toItem<PermissionMap>(payload);
}

export async function setRolePermissions(roleId: number, permissionMap: PermissionMap) {
  await request(`/api/management/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ data: permissionMap }),
  });
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
  roleId?: number;
  blocked?: boolean;
  confirmed?: boolean;
  isBanned?: boolean;
  banReason?: string;
}) {
  const payload = await request<ApiResponse<UserItem>>("/api/management/users", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<UserItem>(payload);
}

export async function updateUser(
  id: number,
  input: {
    username?: string;
    email?: string;
    password?: string;
    roleId?: number;
    blocked?: boolean;
    confirmed?: boolean;
    isBanned?: boolean;
    banReason?: string;
  },
) {
  const payload = await request<ApiResponse<UserItem>>(`/api/management/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<UserItem>(payload);
}

export async function deleteUser(id: number) {
  await request(`/api/management/users/${id}`, { method: "DELETE" });
}

export async function getAdminDashboard() {
  const payload = await request<ApiResponse<AdminDashboardData>>("/api/management/dashboard");
  return toItem<AdminDashboardData>(payload);
}

export type ItineraryDay = {
  id?: number;
  label: string;
  title: string;
  description?: string;
};

export type TourItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  duration?: number;
  price?: number;
  destination?: string;
  thumbnail?: { id: number; url: string; name: string } | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  tags?: Array<Pick<TagItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  itinerary?: ItineraryDay[];
  categoriesCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type TourInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  duration?: number | null;
  price?: number | null;
  destination?: string;
  categories?: string[];
  tags?: string[];
  author?: number | null;
  itinerary?: Omit<ItineraryDay, "id">[];
};

export async function listTours(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[tags][fields][0]": "id",
    "populate[tags][fields][1]": "documentId",
    "populate[tags][fields][2]": "name",
    "populate[tags][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/tours?${query.toString()}`);
  return toPaginated<TourItem>(payload, page, pageSize);
}

export async function getTour(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[tags][fields][0]": "id",
    "populate[tags][fields][1]": "documentId",
    "populate[tags][fields][2]": "name",
    "populate[tags][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[itinerary]": "true",
    "populate[thumbnail]": "true",
  });
  const payload = await request<ApiResponse<TourItem>>(`/api/management/tours/${documentId}?${query.toString()}`);
  return toItem<TourItem>(payload);
}

export async function createTour(input: TourInput) {
  const payload = await request<ApiResponse<TourItem>>("/api/management/tours", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<TourItem>(payload);
}

export async function updateTour(documentId: string, input: TourInput) {
  const payload = await request<ApiResponse<TourItem>>(`/api/management/tours/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<TourItem>(payload);
}

export async function deleteTour(documentId: string) {
  await request(`/api/management/tours/${documentId}`, { method: "DELETE" });
}

export async function publishTour(documentId: string) {
  const payload = await request<ApiResponse<TourItem>>(`/api/management/tours/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<TourItem>(payload);
}

export async function unpublishTour(documentId: string) {
  const payload = await request<ApiResponse<TourItem>>(`/api/management/tours/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<TourItem>(payload);
}

export type AmenityItem = {
  id?: number;
  name: string;
};

export type RoomTypeItem = {
  id?: number;
  name: string;
  description?: string;
  price?: number;
  available?: boolean;
  amenities?: string;
  images?: Array<{ id: number; url: string; name: string }>;
  videoUrl?: string;
};

export type HotelItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  starRating?: number;
  thumbnail?: { id: number; url: string; name: string } | null;
  images?: Array<{ id: number; url: string; name: string }>;
  videoUrl?: string;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  amenities?: AmenityItem[];
  roomTypes?: RoomTypeItem[];
  categoriesCount?: number;
  roomTypesCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type HotelInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  starRating?: number | null;
  categories?: string[];
  author?: number | null;
  thumbnail?: number | null;
  images?: number[];
  videoUrl?: string;
  amenities?: Omit<AmenityItem, "id">[];
  roomTypes?: Omit<RoomTypeItem, "id" | "images">[] & { images?: number[] }[];
};

export async function listHotels(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/hotels?${query.toString()}`);
  return toPaginated<HotelItem>(payload, page, pageSize);
}

export async function getHotel(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[amenities]": "true",
    "populate[roomTypes][populate][images]": "true",
    "populate[thumbnail]": "true",
    "populate[images]": "true",
  });
  const payload = await request<ApiResponse<HotelItem>>(`/api/management/hotels/${documentId}?${query.toString()}`);
  return toItem<HotelItem>(payload);
}

export async function createHotel(input: HotelInput) {
  const payload = await request<ApiResponse<HotelItem>>("/api/management/hotels", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<HotelItem>(payload);
}

export async function updateHotel(documentId: string, input: HotelInput) {
  const payload = await request<ApiResponse<HotelItem>>(`/api/management/hotels/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<HotelItem>(payload);
}

export async function deleteHotel(documentId: string) {
  await request(`/api/management/hotels/${documentId}`, { method: "DELETE" });
}

export async function publishHotel(documentId: string) {
  const payload = await request<ApiResponse<HotelItem>>(`/api/management/hotels/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<HotelItem>(payload);
}

export async function unpublishHotel(documentId: string) {
  const payload = await request<ApiResponse<HotelItem>>(`/api/management/hotels/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<HotelItem>(payload);
}

import { createApiClient } from "./api-client";
// ============================================================================
// TAG MANAGEMENT
// ============================================================================

export type TagItem = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  postsCount?: number;
  toursCount?: number;
};

export type TagInput = {
  name?: string;
  slug?: string;
};

export const tagsApi = createApiClient<TagItem, TagInput>("tags");

export async function listAllTags() {
  const result = await tagsApi.list(1, 1000);
  return result.data;
}

export const {
  list: listTags,
  get: getTag,
  create: createTag,
  update: updateTag,
  delete: deleteTag,
  publish: publishTag,
  unpublish: unpublishTag,
} = tagsApi;

// ============================================================================
// HOMESTAY MANAGEMENT
// ============================================================================

export type HomestayItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  priceRange?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  thumbnail?: { id: number; url: string } | null;
  images?: Array<{ id: number; url: string }>;
};

export type HomestayInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  priceRange?: string;
  categories?: string[];
  author?: number | null;
  thumbnail?: number | null;
  images?: number[];
};

export async function listHomestays(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/homestays?${query.toString()}`);
  return toPaginated<HomestayItem>(payload, page, pageSize);
}

export async function getHomestay(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "populate[images]": "true",
  });
  const payload = await request<ApiResponse<HomestayItem>>(`/api/management/homestays/${documentId}?${query.toString()}`);
  return toItem<HomestayItem>(payload);
}

export async function createHomestay(input: HomestayInput) {
  const payload = await request<ApiResponse<HomestayItem>>("/api/management/homestays", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<HomestayItem>(payload);
}

export async function updateHomestay(documentId: string, input: HomestayInput) {
  const payload = await request<ApiResponse<HomestayItem>>(`/api/management/homestays/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<HomestayItem>(payload);
}

export async function deleteHomestay(documentId: string) {
  await request(`/api/management/homestays/${documentId}`, { method: "DELETE" });
}

export async function publishHomestay(documentId: string) {
  const payload = await request<ApiResponse<HomestayItem>>(`/api/management/homestays/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<HomestayItem>(payload);
}

export async function unpublishHomestay(documentId: string) {
  const payload = await request<ApiResponse<HomestayItem>>(`/api/management/homestays/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<HomestayItem>(payload);
}

// ============================================================================
// RESTAURANT MANAGEMENT
// ============================================================================

export type RestaurantItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  cuisineType?: string;
  priceRange?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  thumbnail?: { id: number; url: string } | null;
  images?: Array<{ id: number; url: string }>;
};

export type RestaurantInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  cuisineType?: string;
  priceRange?: string;
  categories?: string[];
  author?: number | null;
  thumbnail?: number | null;
  images?: number[];
};

export async function listRestaurants(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/restaurants?${query.toString()}`);
  return toPaginated<RestaurantItem>(payload, page, pageSize);
}

export async function getRestaurant(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "populate[images]": "true",
  });
  const payload = await request<ApiResponse<RestaurantItem>>(`/api/management/restaurants/${documentId}?${query.toString()}`);
  return toItem<RestaurantItem>(payload);
}

export async function createRestaurant(input: RestaurantInput) {
  const payload = await request<ApiResponse<RestaurantItem>>("/api/management/restaurants", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<RestaurantItem>(payload);
}

export async function updateRestaurant(documentId: string, input: RestaurantInput) {
  const payload = await request<ApiResponse<RestaurantItem>>(`/api/management/restaurants/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<RestaurantItem>(payload);
}

export async function deleteRestaurant(documentId: string) {
  await request(`/api/management/restaurants/${documentId}`, { method: "DELETE" });
}

export async function publishRestaurant(documentId: string) {
  const payload = await request<ApiResponse<RestaurantItem>>(`/api/management/restaurants/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<RestaurantItem>(payload);
}

export async function unpublishRestaurant(documentId: string) {
  const payload = await request<ApiResponse<RestaurantItem>>(`/api/management/restaurants/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<RestaurantItem>(payload);
}

// ============================================================================
// SOUVENIR SHOP MANAGEMENT
// ============================================================================

export type SouvenirShopItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  shopType?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  thumbnail?: { id: number; url: string } | null;
  images?: Array<{ id: number; url: string }>;
};

export type SouvenirShopInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  shopType?: string;
  categories?: string[];
  author?: number | null;
  thumbnail?: number | null;
  images?: number[];
};

export async function listSouvenirShops(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/souvenir-shops?${query.toString()}`);
  return toPaginated<SouvenirShopItem>(payload, page, pageSize);
}

export async function getSouvenirShop(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "populate[images]": "true",
  });
  const payload = await request<ApiResponse<SouvenirShopItem>>(`/api/management/souvenir-shops/${documentId}?${query.toString()}`);
  return toItem<SouvenirShopItem>(payload);
}

export async function createSouvenirShop(input: SouvenirShopInput) {
  const payload = await request<ApiResponse<SouvenirShopItem>>("/api/management/souvenir-shops", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<SouvenirShopItem>(payload);
}

export async function updateSouvenirShop(documentId: string, input: SouvenirShopInput) {
  const payload = await request<ApiResponse<SouvenirShopItem>>(`/api/management/souvenir-shops/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<SouvenirShopItem>(payload);
}

export async function deleteSouvenirShop(documentId: string) {
  await request(`/api/management/souvenir-shops/${documentId}`, { method: "DELETE" });
}

export async function publishSouvenirShop(documentId: string) {
  const payload = await request<ApiResponse<SouvenirShopItem>>(`/api/management/souvenir-shops/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<SouvenirShopItem>(payload);
}

export async function unpublishSouvenirShop(documentId: string) {
  const payload = await request<ApiResponse<SouvenirShopItem>>(`/api/management/souvenir-shops/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<SouvenirShopItem>(payload);
}

// ============================================================================
// TRAVEL GUIDE MANAGEMENT
// ============================================================================

export type TravelGuideItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  guideType?: "cam-nang" | "meo-du-lich" | "lich-trinh-goi-y";
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<Pick<CategoryItem, "id" | "documentId" | "name" | "slug">>;
  tags?: Array<Pick<TagItem, "id" | "documentId" | "name" | "slug">>;
  author?: Pick<UserItem, "id" | "username" | "email"> | null;
  thumbnail?: { id: number; url: string } | null;
};

export type TravelGuideInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  guideType?: "cam-nang" | "meo-du-lich" | "lich-trinh-goi-y";
  categories?: string[];
  tags?: string[];
  author?: number | null;
  thumbnail?: number | null;
};

export async function listTravelGuides(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published"; category?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[tags][fields][0]": "id",
    "populate[tags][fields][1]": "documentId",
    "populate[tags][fields][2]": "name",
    "populate[tags][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.category ? { "filters[categories][documentId][$eq]": filters.category } : {}),
  });
  const payload = await request(`/api/management/travel-guides?${query.toString()}`);
  const paginated = toPaginated<TravelGuideItem>(payload, page, pageSize);

  // Fallback: some environments may not resolve nested populate tags on list endpoint.
  const guidesMissingTags = paginated.data.filter((guide) => guide.tags == null);
  if (guidesMissingTags.length === 0) {
    return paginated;
  }

  const guideDetails = await Promise.all(
    guidesMissingTags.map(async (guide) => {
      try {
        const detail = await getTravelGuide(guide.documentId);
        return [guide.documentId, detail.tags ?? []] as const;
      } catch {
        return [guide.documentId, []] as const;
      }
    }),
  );

  const tagByDocumentId = new Map(guideDetails);
  return {
    ...paginated,
    data: paginated.data.map((guide) => ({
      ...guide,
      tags: guide.tags ?? tagByDocumentId.get(guide.documentId) ?? [],
    })),
  };
}

export async function getTravelGuide(documentId: string) {
  const query = new URLSearchParams({
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "documentId",
    "populate[categories][fields][2]": "name",
    "populate[categories][fields][3]": "slug",
    "populate[tags][fields][0]": "id",
    "populate[tags][fields][1]": "documentId",
    "populate[tags][fields][2]": "name",
    "populate[tags][fields][3]": "slug",
    "populate[author][fields][0]": "id",
    "populate[author][fields][1]": "username",
    "populate[author][fields][2]": "email",
    "populate[thumbnail]": "true",
  });
  const payload = await request<ApiResponse<TravelGuideItem>>(`/api/management/travel-guides/${documentId}?${query.toString()}`);
  return toItem<TravelGuideItem>(payload);
}

export async function createTravelGuide(input: TravelGuideInput) {
  const payload = await request<ApiResponse<TravelGuideItem>>("/api/management/travel-guides", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<TravelGuideItem>(payload);
}

export async function updateTravelGuide(documentId: string, input: TravelGuideInput) {
  const payload = await request<ApiResponse<TravelGuideItem>>(`/api/management/travel-guides/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<TravelGuideItem>(payload);
}

export async function deleteTravelGuide(documentId: string) {
  await request(`/api/management/travel-guides/${documentId}`, { method: "DELETE" });
}

export async function publishTravelGuide(documentId: string) {
  const payload = await request<ApiResponse<TravelGuideItem>>(`/api/management/travel-guides/${documentId}/publish`, {
    method: "POST",
  });
  return toItem<TravelGuideItem>(payload);
}

export async function unpublishTravelGuide(documentId: string) {
  const payload = await request<ApiResponse<TravelGuideItem>>(`/api/management/travel-guides/${documentId}/unpublish`, {
    method: "POST",
  });
  return toItem<TravelGuideItem>(payload);
}

// ============================================================================
// HOMEPAGE + CONTENT PAGES
// ============================================================================

export type HomepageItem = {
  id?: number;
  documentId?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaLink?: string;
  featuredLabel?: string;
  postsSectionTitle?: string;
  destinationsSectionTitle?: string;
  featuredPostsCount?: number;
  feedPostsCount?: number;
};

export type HomepageInput = Partial<HomepageItem>;

export async function getHomepage() {
  const payload = await request<ApiResponse<HomepageItem>>("/api/management/homepage");
  return toItem<HomepageItem>(payload);
}

export async function updateHomepage(input: HomepageInput) {
  const payload = await request<ApiResponse<HomepageItem>>("/api/management/homepage", {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<HomepageItem>(payload);
}

export type ContentPageItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  navigationLabel?: string;
  showInHeader?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ContentPageInput = {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  navigationLabel?: string;
  showInHeader?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
};

export async function listContentPages(page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, q = "") {
  const query = new URLSearchParams({
    sort: "sortOrder:asc",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(q.trim() ? { q: q.trim() } : {}),
  });
  const payload = await request(`/api/management/content-pages?${query.toString()}`);
  return toPaginated<ContentPageItem>(payload, page, pageSize);
}

export async function getContentPage(documentId: string) {
  const payload = await request<ApiResponse<ContentPageItem>>(`/api/management/content-pages/${documentId}`);
  return toItem<ContentPageItem>(payload);
}

export async function createContentPage(input: ContentPageInput) {
  const payload = await request<ApiResponse<ContentPageItem>>("/api/management/content-pages", {
    method: "POST",
    body: JSON.stringify({ data: input }),
  });
  return toItem<ContentPageItem>(payload);
}

export async function updateContentPage(documentId: string, input: ContentPageInput) {
  const payload = await request<ApiResponse<ContentPageItem>>(`/api/management/content-pages/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: input }),
  });
  return toItem<ContentPageItem>(payload);
}

export async function deleteContentPage(documentId: string) {
  await request(`/api/management/content-pages/${documentId}`, { method: "DELETE" });
}

// ============================================================================
// REPORTS + CONTACT
// ============================================================================

type BasicUserRef = {
  id: number;
  username?: string;
  email?: string;
};

export type ReportItem = {
  id: number;
  documentId: string;
  actionType: "report";
  targetType: string;
  targetDocumentId: string;
  user?: BasicUserRef | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listReports(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; targetType?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.targetType && filters.targetType !== "all"
      ? { targetType: filters.targetType }
      : {}),
  });
  const payload = await request(`/api/management/reports?${query.toString()}`);
  return toPaginated<ReportItem>(payload, page, pageSize);
}

export async function deleteReport(documentId: string) {
  await request(`/api/management/reports/${documentId}`, { method: "DELETE" });
}

export type ContactRequestStatus = "pending" | "sent" | "failed";

export type ContactRequestItem = {
  id: number;
  documentId: string;
  targetType: string;
  targetDocumentId: string;
  targetTitle?: string | null;
  message: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterUser?: BasicUserRef | null;
  ownerUser?: BasicUserRef | null;
  status: ContactRequestStatus;
  createdAt?: string;
  updatedAt?: string;
};

export async function listContactRequests(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | ContactRequestStatus; targetType?: string },
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters?.targetType && filters.targetType !== "all"
      ? { targetType: filters.targetType }
      : {}),
  });
  const payload = await request(`/api/management/contact-requests?${query.toString()}`);
  return toPaginated<ContactRequestItem>(payload, page, pageSize);
}

export async function updateContactRequest(documentId: string, input: Partial<ContactRequestItem>) {
  const payload = await request<ApiResponse<ContactRequestItem>>(
    `/api/management/contact-requests/${documentId}`,
    {
      method: "PUT",
      body: JSON.stringify({ data: input }),
    },
  );
  return toItem<ContactRequestItem>(payload);
}

export type ContactEmailTemplateItem = {
  id?: number;
  documentId?: string;
  ownerSubject?: string;
  ownerBody?: string;
  adminSubject?: string;
  adminBody?: string;
  requesterSubject?: string;
  requesterBody?: string;
  serviceOverrides?: Record<
    string,
    {
      ownerSubject?: string;
      ownerBody?: string;
      adminSubject?: string;
      adminBody?: string;
      requesterSubject?: string;
      requesterBody?: string;
    }
  >;
};

export type ContactEmailTemplateInput = Partial<ContactEmailTemplateItem>;

export async function getContactEmailTemplate() {
  const payload = await request<ApiResponse<ContactEmailTemplateItem>>(
    "/api/management/contact-email-template",
  );
  return toItem<ContactEmailTemplateItem>(payload);
}

export async function updateContactEmailTemplate(input: ContactEmailTemplateInput) {
  const payload = await request<ApiResponse<ContactEmailTemplateItem>>(
    "/api/management/contact-email-template",
    {
      method: "PUT",
      body: JSON.stringify({ data: input }),
    },
  );
  return toItem<ContactEmailTemplateItem>(payload);
}


