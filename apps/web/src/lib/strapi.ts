const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

type StrapiListResponse<T> = {
  data: T[];
};

export type Category = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  parent?: {
    documentId: string;
    name: string;
    slug: string;
  } | null;
  children?: Category[];
};

type CategoryNode = {
  documentId: string;
  slug: string;
  parent?: {
    documentId: string;
  } | null;
};

export type Comment = {
  id: number;
  documentId: string;
  authorName: string;
  content: string;
  targetType:
    | "post"
    | "page"
    | "product"
    | "hotel"
    | "tour"
    | "restaurant"
    | "homestay"
    | "souvenir-shop"
    | "shop"
    | "other";
  targetDocumentId: string;
  createdAt: string;
  parent?: { documentId: string } | null;
};

export type Tag = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
};

export type Post = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  preferredImageUrl?: string;
  introText?: string;
  categories?: Category[];
  tags?: Tag[];
  publishedAt?: string;
  status?: "draft" | "published";
  commentsCount?: number;
  likesCount?: number;
};

export type HomepageConfig = {
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

export type PublicContentPage = {
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
};

async function strapiFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error(`Failed to fetch from Strapi at ${API_URL}${path}:`, error);
    throw new Error(`Failed to connect to the Strapi API. Please ensure the API server is running at ${API_URL}`);
  }

  if (!response.ok) {
    throw new Error(`Strapi request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}


function resolveAssetUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

function extractFirstImageUrl(input?: string) {
  if (!input) return undefined;
  const match = input.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function toPlainText(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePostsForPresentation(posts: Post[]) {
  return posts.map((post) => ({
    ...post,
    preferredImageUrl:
      post.featuredImageUrl?.trim() ||
      extractFirstImageUrl(post.excerpt) ||
      extractFirstImageUrl(post.content),
    introText: toPlainText(post.excerpt) || toPlainText(post.content),
  }));
}

export async function getHomepageConfig() {
  try {
    const payload = await strapiFetch<{ data?: HomepageConfig | null }>(
      "/api/site-content/homepage",
    );
    return payload.data ?? null;
  } catch (error) {
    console.error("Error fetching homepage config:", error);
    return null;
  }
}

export async function getPublicContentPages() {
  try {
    const payload = await strapiFetch<StrapiListResponse<PublicContentPage>>(
      "/api/site-content/pages",
    );
    return payload.data ?? [];
  } catch (error) {
    console.error("Error fetching public content pages:", error);
    return [];
  }
}

export async function getPublicContentPageBySlug(slug: string) {
  try {
    const payload = await strapiFetch<{ data?: PublicContentPage | null }>(
      `/api/site-content/pages/${encodeURIComponent(slug)}`,
    );
    return payload.data ?? null;
  } catch (error) {
    console.error("Error fetching public content page by slug:", error);
    return null;
  }
}

export async function getPosts() {
  const query =
    "/api/posts?sort=publishedAt:desc&populate[categories][fields][0]=name&populate[categories][fields][1]=slug";
  const payload = await strapiFetch<StrapiListResponse<Post>>(query);
  const withFeatured = await attachPostFeaturedImages(payload.data ?? []);
  return normalizePostsForPresentation(withFeatured);
}

export async function getTopLevelCategories() {
  // Populate parent field so we can filter client-side (Strapi v5 null-relation filter may not work reliably)
  const payload = await strapiFetch<StrapiListResponse<Category>>(
    "/api/categories?populate[parent][fields][0]=id&sort[0]=sortOrder:asc&sort[1]=name:asc"
  );
  return payload.data.filter((cat) => !cat.parent);
}

export async function getPostsWithPagination(page: number = 1, pageSize: number = 10, categorySlug?: string) {
  let query = `/api/posts?sort=publishedAt:desc&populate[categories][fields][0]=name&populate[categories][fields][1]=slug&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
  
  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }
  
  const payload = await strapiFetch<{ data: Post[]; meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } } }>(query);
  payload.data = await attachPostStats(payload.data);
  payload.data = await attachPostFeaturedImages(payload.data);
  payload.data = normalizePostsForPresentation(payload.data);
  return payload;
}

export async function getPostsWithPaginationByTag(
  page: number = 1,
  pageSize: number = 10,
  tagSlug?: string,
) {
  let query = `/api/posts?sort=publishedAt:desc&populate[categories][fields][0]=name&populate[categories][fields][1]=slug&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (tagSlug) {
    query += `&filters[tags][slug][$eq]=${encodeURIComponent(tagSlug)}`;
  }

  const payload = await strapiFetch<{
    data: Post[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  payload.data = await attachPostStats(payload.data);
  payload.data = await attachPostFeaturedImages(payload.data);
  payload.data = normalizePostsForPresentation(payload.data);
  return payload;
}

type TargetIdRow = { targetDocumentId: string };
type PagedRowsResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      page?: number;
      pageCount?: number;
      total?: number;
    };
  };
};

async function fetchAllTargetIds(baseQueryPath: string) {
  const pageSize = 1000;
  let page = 1;
  let pageCount = 1;
  const rows: string[] = [];

  while (page <= pageCount) {
    const payload = await strapiFetch<PagedRowsResponse<TargetIdRow>>(
      `${baseQueryPath}&fields[0]=targetDocumentId&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    );
    rows.push(...(payload.data ?? []).map((item) => item.targetDocumentId).filter(Boolean));
    pageCount = payload.meta?.pagination?.pageCount ?? 1;
    page += 1;
  }

  return rows;
}

async function attachPostStats(posts: Post[]) {
  if (!posts.length) {
    return posts;
  }

  const inFilters = posts
    .map((post, index) => `&filters[targetDocumentId][$in][${index}]=${encodeURIComponent(post.documentId)}`)
    .join("");

  const [commentTargetIds, likeTargetIds] = await Promise.all([
    fetchAllTargetIds(`/api/comments?filters[targetType][$eq]=post${inFilters}`).catch(() => [] as string[]),
    fetchAllTargetIds(`/api/interactions?filters[actionType][$eq]=like&filters[targetType][$eq]=post${inFilters}`).catch(() => [] as string[]),
  ]);

  const commentsCountMap = new Map<string, number>();
  for (const targetId of commentTargetIds) {
    commentsCountMap.set(targetId, (commentsCountMap.get(targetId) ?? 0) + 1);
  }

  const likesCountMap = new Map<string, number>();
  for (const targetId of likeTargetIds) {
    likesCountMap.set(targetId, (likesCountMap.get(targetId) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    commentsCount: commentsCountMap.get(post.documentId) ?? 0,
    likesCount: likesCountMap.get(post.documentId) ?? 0,
  }));
}

type EntityMediaThumbnailItem = {
  entityDocumentId?: string;
  file?: { url?: string } | Array<{ url?: string }>;
};

async function attachPostFeaturedImages(posts: Post[]) {
  if (!posts.length) {
    return posts;
  }

  try {
    let query =
      "/api/entity-medias?filters[entityType][$eq]=post&filters[mediaCategory][$eq]=thumbnail" +
      "&fields[0]=entityDocumentId&sort[0]=sortOrder:asc&sort[1]=createdAt:asc" +
      "&populate[file][fields][0]=url";

    posts.forEach((post, index) => {
      query += `&filters[entityDocumentId][$in][${index}]=${encodeURIComponent(post.documentId)}`;
    });

    const payload = await strapiFetch<StrapiListResponse<EntityMediaThumbnailItem>>(query);
    const featuredMap = new Map<string, string>();

    for (const item of payload.data ?? []) {
      const entityDocumentId = item.entityDocumentId ?? "";
      if (!entityDocumentId || featuredMap.has(entityDocumentId)) {
        continue;
      }

      const fileValue = item.file;
      const file = Array.isArray(fileValue) ? fileValue[0] : fileValue;
      const url = resolveAssetUrl(file?.url);
      if (url) {
        featuredMap.set(entityDocumentId, url);
      }
    }

    return posts.map((post) => ({
      ...post,
      featuredImageUrl: featuredMap.get(post.documentId),
    }));
  } catch {
    return posts;
  }
}

async function getCategorySubtreeSlugs(categorySlug: string) {
  const payload = await strapiFetch<StrapiListResponse<CategoryNode>>(
    "/api/categories?fields[0]=documentId&fields[1]=slug&populate[parent][fields][0]=documentId&pagination[page]=1&pagination[pageSize]=1000",
  );

  const rows = payload.data;
  const root = rows.find((item) => item.slug === categorySlug);
  if (!root) {
    return [];
  }

  const childrenByParent = new Map<string, string[]>();
  for (const item of rows) {
    const parentId = item.parent?.documentId;
    if (!parentId) {
      continue;
    }
    const bucket = childrenByParent.get(parentId) ?? [];
    bucket.push(item.documentId);
    childrenByParent.set(parentId, bucket);
  }

  const slugMap = new Map<string, string>(rows.map((item) => [item.documentId, item.slug]));
  const visitedIds: string[] = [];
  const queue: string[] = [root.documentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visitedIds.includes(currentId)) {
      continue;
    }

    visitedIds.push(currentId);
    const children = childrenByParent.get(currentId) ?? [];
    for (const childId of children) {
      queue.push(childId);
    }
  }

  return visitedIds.map((id) => slugMap.get(id)).filter(Boolean) as string[];
}

export async function getTopPosts(limit: number = 10) {
  // Using newest posts as a proxy for top posts since Strapi doesn't natively sort by comment count out-of-the-box
  const query = `/api/posts?sort=createdAt:desc&pagination[limit]=${limit}`;
  const payload = await strapiFetch<StrapiListResponse<Post>>(query);
  const withFeatured = await attachPostFeaturedImages(payload.data ?? []);
  return normalizePostsForPresentation(withFeatured);
}

export async function getPostBySlug(slug: string) {
  const query =
    `/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}` +
    "&populate[categories][fields][0]=name" +
    "&populate[categories][fields][1]=slug";

  const payload = await strapiFetch<StrapiListResponse<Post>>(query);
  const withFeatured = await attachPostFeaturedImages(payload.data ?? []);
  return normalizePostsForPresentation(withFeatured)[0] ?? null;
}

export async function getCommentsForTarget(
  targetType: Comment["targetType"],
  targetDocumentId: string,
) {
  const pageSize = 200;
  const baseQuery =
    `/api/comments?filters[targetType][$eq]=${encodeURIComponent(targetType)}` +
    `&filters[targetDocumentId][$eq]=${encodeURIComponent(targetDocumentId)}` +
    "&populate[parent][fields][0]=documentId" +
    "&sort=createdAt:asc";

  const first = await strapiFetch<{ data: Comment[]; meta?: { pagination?: { pageCount?: number } } }>(
    `${baseQuery}&pagination[page]=1&pagination[pageSize]=${pageSize}`,
  );

  const all = [...(first.data ?? [])];
  const pageCount = Math.max(1, first.meta?.pagination?.pageCount ?? 1);

  for (let page = 2; page <= pageCount; page += 1) {
    const next = await strapiFetch<StrapiListResponse<Comment>>(
      `${baseQuery}&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    );
    all.push(...(next.data ?? []));
  }

  return all;
}

export async function getCategoryBySlug(slug: string) {
  const payload = await strapiFetch<StrapiListResponse<Category>>(
    "/api/categories?" +
      "fields[0]=name&fields[1]=slug&fields[2]=documentId&fields[3]=description" +
      "&populate[parent][fields][0]=documentId" +
      "&populate[parent][fields][1]=name" +
      "&populate[parent][fields][2]=slug" +
      "&pagination[page]=1&pagination[pageSize]=1000",
  );

  const rows = payload.data;
  const category = rows.find((item) => item.slug === slug) ?? null;
  if (!category) {
    return null;
  }

  const children = rows
    .filter((item) => item.parent?.documentId === category.documentId)
    .map((item) => ({
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
    })) as Category[];

  return {
    ...category,
    parent: category.parent
      ? {
          documentId: category.parent.documentId,
          name: category.parent.name,
          slug: category.parent.slug,
        }
      : null,
    children,
  };
}

export async function getAllCategories() {
  const payload = await strapiFetch<StrapiListResponse<Category>>(
    "/api/categories?" +
      "fields[0]=name&fields[1]=slug&fields[2]=documentId&fields[3]=sortOrder" +
      "&populate[parent][fields][0]=documentId" +
      "&pagination[page]=1&pagination[pageSize]=1000" +
      "&sort[0]=sortOrder:asc&sort[1]=name:asc",
  );

  return payload.data ?? [];
}
export async function getPostByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Post>>(
      `/api/posts?filters[documentId][$eq]=${documentId}&populate=*`,
    );
    const withFeatured = await attachPostFeaturedImages(payload.data ?? []);
    return normalizePostsForPresentation(withFeatured)[0] ?? null;
  } catch (error) {
    console.error("Error fetching post by documentId:", error);
    return null;
  }
}

export type GalleryMediaItem = {
  documentId: string;
  file: { url: string; mime: string; width?: number; height?: number };
  caption?: string;
  altText?: string;
  sortOrder: number;
};

export async function getPostGallery(postDocumentId: string): Promise<GalleryMediaItem[]> {
  try {
    const query =
      `/api/entity-medias?filters[entityType][$eq]=post` +
      `&filters[entityDocumentId][$eq]=${encodeURIComponent(postDocumentId)}` +
      `&filters[mediaCategory][$eq]=gallery` +
      `&sort[0]=sortOrder:asc&populate[file][fields][0]=url&populate[file][fields][1]=mime` +
      `&populate[file][fields][2]=width&populate[file][fields][3]=height` +
      `&pagination[pageSize]=50`;
    const payload = await strapiFetch<StrapiListResponse<GalleryMediaItem>>(query);
    return (payload.data ?? []).map((item) => ({
      ...item,
      file: { ...item.file, url: resolveAssetUrl(item.file?.url) },
    }));
  } catch {
    return [];
  }
}

export type ItineraryDay = {
  id?: number;
  label: string;
  title: string;
  description?: string;
};

export type Tour = {
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
  categories?: Category[];
  itinerary?: ItineraryDay[];
  publishedAt?: string;
};

export async function getToursWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
) {
  let query =
    `/api/tours?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  const payload = await strapiFetch<{
    data: Tour[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

export async function getTourByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Tour>>(
      `/api/tours?filters[documentId][$eq]=${documentId}` +
        `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&populate[itinerary]=true`,
    );
    return payload.data[0] ?? null;
  } catch (error) {
    console.error("Error fetching tour by documentId:", error);
    return null;
  }
}

export type Amenity = {
  id?: number;
  name: string;
};

export type RoomType = {
  id?: number;
  name: string;
  description?: string;
  price?: number;
  available?: boolean;
  amenities?: string;
  images?: Array<{ id: number; url: string; name: string }>;
  videoUrl?: string;
};

export type Hotel = {
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
  categories?: Category[];
  amenities?: Amenity[];
  roomTypes?: RoomType[];
  publishedAt?: string;
};

export type Homestay = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  priceRange?: string;
  thumbnail?: { id: number; url: string; name: string } | null;
  images?: Array<{ id: number; url: string; name: string }>;
  categories?: Category[];
  amenities?: Amenity[];
  publishedAt?: string;
};

export type Restaurant = {
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
  thumbnail?: { id: number; url: string; name: string } | null;
  images?: Array<{ id: number; url: string; name: string }>;
  categories?: Category[];
  publishedAt?: string;
};

export type SouvenirShop = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  shopType?: string;
  thumbnail?: { id: number; url: string; name: string } | null;
  images?: Array<{ id: number; url: string; name: string }>;
  categories?: Category[];
  publishedAt?: string;
};

export type TravelGuide = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  guideType?: "cam-nang" | "meo-du-lich" | "lich-trinh-goi-y";
  thumbnail?: { id: number; url: string; name: string } | null;
  categories?: Category[];
  tags?: Tag[];
  author?: { username: string } | null;
  publishedAt?: string;
};

export async function getHotelsWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
) {
  let query =
    `/api/hotels?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&populate[amenities]=true` +
    `&populate[roomTypes][populate][images]=true` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  const payload = await strapiFetch<{
    data: Hotel[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

export async function getHotelByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Hotel>>(
      `/api/hotels?filters[documentId][$eq]=${documentId}` +
        `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&populate[images]=true` +
        `&populate[amenities]=true` +
        `&populate[roomTypes][populate][images]=true`,
    );
    return payload.data[0] ?? null;
  } catch (error) {
    console.error("Error fetching hotel by documentId:", error);
    return null;
  }
}

// Tag functions
export async function getTagsByPost(postSlug: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/tags?filters[posts][slug][$eq]=${encodeURIComponent(postSlug)}&fields[0]=name&fields[1]=slug`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // Tags are optional on post detail; do not treat missing tag endpoint as page error.
      return [];
    }

    const payload = (await response.json()) as StrapiListResponse<Tag>;
    return payload.data ?? [];
  } catch (error) {
    console.error("Error fetching tags for post:", error);
    return [];
  }
}

export async function getTagBySlug(slug: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Tag>>(
      `/api/tags?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=name&fields[1]=slug`,
    );
    return payload.data?.[0] ?? null;
  } catch (error) {
    console.error("Error fetching tag by slug:", error);
    return null;
  }
}

export async function getTagsByTour(tourSlug: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/tags?filters[tours][slug][$eq]=${encodeURIComponent(tourSlug)}&fields[0]=name&fields[1]=slug`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as StrapiListResponse<Tag>;
    return payload.data ?? [];
  } catch (error) {
    console.error("Error fetching tags for tour:", error);
    return [];
  }
}

export async function getPostsByTags(tagSlugs: string[], limit: number = 5) {
  if (!tagSlugs || tagSlugs.length === 0) {
    return [];
  }

  try {
    let query =
      `/api/posts?sort=publishedAt:desc` +
      `&fields[0]=title&fields[1]=slug&fields[2]=documentId&fields[3]=publishedAt` +
      `&pagination[pageSize]=${limit}`;

    tagSlugs.forEach((slug, index) => {
      query += `&filters[tags][slug][$in][${index}]=${encodeURIComponent(slug)}`;
    });

    const payload = await strapiFetch<StrapiListResponse<Post>>(query);
    return payload.data ?? [];
  } catch (error) {
    console.error("Error fetching posts by tags:", error);
    return [];
  }
}

// Homestay functions
export async function getHomestayByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Homestay>>(
      `/api/homestays?filters[documentId][$eq]=${documentId}` +
        `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&populate[images]=true` +
        `&populate[amenities]=true`,
    );
    return payload.data[0] ?? null;
  } catch (error) {
    console.error("Error fetching homestay by documentId:", error);
    return null;
  }
}

export async function getHomestaysWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
) {
  let query =
    `/api/homestays?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  const payload = await strapiFetch<{
    data: Homestay[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

// Restaurant functions
export async function getRestaurantByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<Restaurant>>(
      `/api/restaurants?filters[documentId][$eq]=${documentId}` +
        `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&populate[images]=true`,
    );
    return payload.data[0] ?? null;
  } catch (error) {
    console.error("Error fetching restaurant by documentId:", error);
    return null;
  }
}

export async function getRestaurantsWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
) {
  let query =
    `/api/restaurants?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  const payload = await strapiFetch<{
    data: Restaurant[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

// SouvenirShop functions
export async function getSouvenirShopByDocumentId(documentId: string) {
  try {
    const payload = await strapiFetch<StrapiListResponse<SouvenirShop>>(
      `/api/souvenir-shops?filters[documentId][$eq]=${documentId}` +
        `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&populate[images]=true`,
    );
    return payload.data[0] ?? null;
  } catch (error) {
    console.error("Error fetching souvenir shop by documentId:", error);
    return null;
  }
}

// SouvenirShop functions
export async function getSouvenirShopsWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
) {
  let query =
    `/api/souvenir-shops?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  const payload = await strapiFetch<{
    data: SouvenirShop[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

// TravelGuide functions
export async function getTravelGuidesWithPagination(
  page: number = 1,
  pageSize: number = 10,
  categorySlug?: string,
  guideType?: string,
  keyword?: string,
  tagSlug?: string,
) {
  let query =
    `/api/travel-guides?sort=publishedAt:desc` +
    `&populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&populate[tags][fields][0]=name&populate[tags][fields][1]=slug` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

  if (categorySlug) {
    const categorySlugs = await getCategorySubtreeSlugs(categorySlug);
    if (categorySlugs.length > 0) {
      categorySlugs.forEach((slug, index) => {
        query += `&filters[categories][slug][$in][${index}]=${encodeURIComponent(slug)}`;
      });
    } else {
      query += `&filters[categories][slug][$eq]=${encodeURIComponent(categorySlug)}`;
    }
  }

  if (guideType) {
    query += `&filters[guideType][$eq]=${encodeURIComponent(guideType)}`;
  }

  if (keyword?.trim()) {
    const q = keyword.trim();
    query += `&filters[$or][0][title][$containsi]=${encodeURIComponent(q)}`;
    query += `&filters[$or][1][excerpt][$containsi]=${encodeURIComponent(q)}`;
    query += `&filters[$or][2][slug][$containsi]=${encodeURIComponent(q)}`;
  }

  if (tagSlug?.trim()) {
    query += `&filters[tags][slug][$eq]=${encodeURIComponent(tagSlug.trim())}`;
  }

  const payload = await strapiFetch<{
    data: TravelGuide[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }>(query);
  return payload;
}

export async function getTravelGuideByDocumentId(documentId: string): Promise<TravelGuide | null> {
  const query =
    `/api/travel-guides/${documentId}` +
    `?populate[categories][fields][0]=name&populate[categories][fields][1]=slug` +
    `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
    `&populate[author][fields][0]=username` +
    `&populate[tags][fields][0]=name&populate[tags][fields][1]=slug`;
  try {
    const payload = await strapiFetch<{ data: TravelGuide }>(query);
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function getTagsByTravelGuide(guideSlug: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/tags?filters[travelGuides][slug][$eq]=${encodeURIComponent(guideSlug)}&fields[0]=name&fields[1]=slug`,
      { headers: { "Content-Type": "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as StrapiListResponse<Tag>;
    return payload.data ?? [];
  } catch {
    return [];
  }
}

export async function getTravelGuidesByTags(
  tagSlugs: string[],
  limit: number = 3,
) {
  if (!tagSlugs || tagSlugs.length === 0) {
    return [];
  }

  try {
    let query =
      `/api/travel-guides?sort=publishedAt:desc` +
      `&fields[0]=title&fields[1]=slug&fields[2]=documentId&fields[3]=guideType` +
      `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
      `&pagination[pageSize]=${limit}`;

    tagSlugs.forEach((slug, index) => {
      query += `&filters[tags][slug][$in][${index}]=${encodeURIComponent(slug)}`;
    });

    const payload = await strapiFetch<StrapiListResponse<TravelGuide>>(query);
    return payload.data ?? [];
  } catch (error) {
    console.error("Error fetching travel guides by tags:", error);
    return [];
  }
}

// Function to suggest tours by tags
export async function getToursByTags(
  tagSlugs: string[],
  limit: number = 3,
) {
  if (!tagSlugs || tagSlugs.length === 0) {
    return [];
  }

  try {
    let query = `/api/tours?sort=publishedAt:desc&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name`;
    
    tagSlugs.forEach((slug, index) => {
      query += `&filters[tags][slug][$in][${index}]=${encodeURIComponent(slug)}`;
    });
    
    query += `&pagination[pageSize]=${limit}`;
    
    const payload = await strapiFetch<StrapiListResponse<Tour>>(query);
    const directMatches = payload.data ?? [];
    if (directMatches.length > 0) {
      return directMatches;
    }

    // Fallback: if data was not linked via tag relation yet, suggest tours whose slug contains tag slugs.
    const fallbackPayload = await strapiFetch<StrapiListResponse<Tour>>(
      `/api/tours?sort=publishedAt:desc` +
        `&fields[0]=title&fields[1]=slug&fields[2]=documentId&fields[3]=destination&fields[4]=duration` +
        `&populate[thumbnail][fields][0]=url&populate[thumbnail][fields][1]=name` +
        `&pagination[pageSize]=20`,
    );

    const fallbackMatches = (fallbackPayload.data ?? []).filter((tour) =>
      tagSlugs.some((tagSlug) => tour.slug?.includes(tagSlug)),
    );

    return fallbackMatches.slice(0, limit);
  } catch (error) {
    console.error("Error fetching tours by tags:", error);
    return [];
  }
}
