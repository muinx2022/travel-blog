import { factories } from '@strapi/strapi';

const UID = 'api::restaurant.restaurant';

function toPagination(query: any) {
  const page = Math.max(1, Number(query?.pagination?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pagination?.pageSize ?? 10) || 10));
  return { page, pageSize };
}

function toStatus(status: unknown): 'draft' | 'published' | undefined {
  return status === 'draft' || status === 'published' ? status : undefined;
}

function andFilters(a: any, b: any) {
  if (a && b) return { $and: [a, b] };
  return a ?? b;
}

async function safeCountDocuments(strapi: any, uid: string, params: any) {
  try {
    const count = await strapi.documents(uid).count(params);
    if (Number.isFinite(count)) {
      return Number(count);
    }
  } catch {
    // Fallback for environments where documents().count is unavailable.
  }

  const pageSize = 1000;
  let page = 1;
  let total = 0;
  const { pagination: _ignored, ...baseParams } = params ?? {};

  while (true) {
    const rows = (await strapi.documents(uid).findMany({
      ...baseParams,
      fields: ['documentId'],
      pagination: { page, pageSize },
    })) as Array<{ documentId?: string }>;

    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }

    total += rows.length;

    if (rows.length < pageSize) {
      break;
    }
    page += 1;
  }

  return total;
}

async function findAllDocumentIdsByStatus(
  strapi: any,
  status: 'draft' | 'published',
  filters: any,
) {
  const pageSize = 1000;
  let page = 1;
  const ids: string[] = [];

  while (true) {
    const batch = (await strapi.documents(UID).findMany({
      sort: 'updatedAt:desc',
      filters,
      fields: ['documentId'],
      pagination: { page, pageSize },
      status,
    })) as Array<{ documentId: string }>;

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    ids.push(...batch.map((entry) => entry.documentId).filter((id): id is string => Boolean(id)));

    if (batch.length < pageSize) {
      break;
    }
    page += 1;
  }

  return ids;
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  async listForAdmin(query: any) {
    const { page, pageSize } = toPagination(query);
    const sort = query?.sort ?? 'updatedAt:desc';
    const status = toStatus(query?.status);
    const keyword = String(query?.q ?? '').trim();
    const keywordFilters = keyword
      ? {
          $or: [
            { title: { $containsi: keyword } },
            { slug: { $containsi: keyword } },
            { excerpt: { $containsi: keyword } },
            { address: { $containsi: keyword } },
            { city: { $containsi: keyword } },
            { cuisineType: { $containsi: keyword } },
          ],
        }
      : undefined;
    const filters = query?.filters
      ? keywordFilters
        ? { $and: [query.filters, keywordFilters] }
        : query.filters
      : keywordFilters;

    let effectiveFilters = filters;
    if (status === 'draft') {
      const publishedDocumentIds = await findAllDocumentIdsByStatus(strapi, 'published', filters);
      if (publishedDocumentIds.length > 0) {
        effectiveFilters = andFilters(filters, {
          documentId: { $notIn: publishedDocumentIds },
        });
      }
    }

    const [data, total] = await Promise.all([
      strapi.documents(UID).findMany({
        sort,
        filters: effectiveFilters,
        populate: query?.populate,
        pagination: { page, pageSize },
        status,
      }),
      safeCountDocuments(strapi, UID, { status, filters: effectiveFilters }),
    ]);

    const enriched = await Promise.all(
      (data as any[]).map(async (item) => {
        const publishedVersion = await strapi.documents(UID).findOne({
          documentId: item.documentId,
          status: 'published',
          fields: ['publishedAt'],
        });

        return {
          ...item,
          publishedAt: publishedVersion?.publishedAt ?? null,
          categoriesCount: Array.isArray(item.categories) ? item.categories.length : 0,
        };
      }),
    );

    return {
      data: enriched,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.max(1, Math.ceil(total / pageSize)),
          total,
        },
      },
    };
  },

  async findOneForAdmin(documentId: string, query: any) {
    return strapi.documents(UID).findOne({
      documentId,
      populate: query?.populate ?? ['categories', 'author', 'thumbnail', 'images'],
      fields: query?.fields,
      status: toStatus(query?.status),
      locale: query?.locale,
    });
  },

  async createForAdmin(payload: any) {
    const data = { ...(payload ?? {}) };
    if ('author' in data) {
      const authorId = Number(data.author);
      data.author = Number.isFinite(authorId) ? authorId : null;
    }
    return strapi.documents(UID).create({
      data,
      status: 'draft',
    });
  },

  async updateForAdmin(documentId: string, payload: any) {
    const data = { ...(payload ?? {}) };
    if ('author' in data) {
      const authorId = Number(data.author);
      data.author = Number.isFinite(authorId) ? authorId : null;
    }
    return strapi.documents(UID).update({
      documentId,
      data,
    });
  },

  async deleteForAdmin(documentId: string) {
    return strapi.documents(UID).delete({ documentId });
  },

  async publishForAdmin(documentId: string) {
    const result = await strapi.documents(UID).publish({ documentId });
    return result?.entries?.[0] ?? null;
  },

  async unpublishForAdmin(documentId: string) {
    return strapi.documents(UID).unpublish({ documentId });
  },
}));
