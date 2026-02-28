import { factories } from '@strapi/strapi';

const UID = 'api::tag.tag';
const POST_UID = 'api::post.post';
const TOUR_UID = 'api::tour.tour';

function toPagination(query: any) {
  const page = Math.max(1, Number(query?.pagination?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pagination?.pageSize ?? 10) || 10));
  return { page, pageSize };
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
  uid: string,
  status: 'draft' | 'published',
  filters: any,
) {
  const pageSize = 1000;
  let page = 1;
  const ids: string[] = [];

  while (true) {
    const batch = (await strapi.documents(uid).findMany({
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

async function countUniqueLinkedDocuments(strapi: any, uid: string, tagDocId: string) {
  const relationFilter = { tags: { documentId: { $eq: tagDocId } } };
  const publishedIds = await findAllDocumentIdsByStatus(strapi, uid, 'published', relationFilter);
  const draftOnlyFilter =
    publishedIds.length > 0
      ? andFilters(relationFilter, { documentId: { $notIn: publishedIds } })
      : relationFilter;
  const draftOnlyIds = await findAllDocumentIdsByStatus(strapi, uid, 'draft', draftOnlyFilter);
  return publishedIds.length + draftOnlyIds.length;
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  async listForAdmin(query: any) {
    const { page, pageSize } = toPagination(query);
    const sort = query?.sort ?? 'updatedAt:desc';
    const keyword = String(query?.q ?? '').trim();
    const keywordFilters = keyword
      ? {
          $or: [
            { name: { $containsi: keyword } },
            { slug: { $containsi: keyword } },
          ],
        }
      : undefined;
    const filters = query?.filters
      ? keywordFilters
        ? { $and: [query.filters, keywordFilters] }
        : query.filters
      : keywordFilters;

    const [data, total] = await Promise.all([
      strapi.documents(UID).findMany({
        sort,
        filters,
        populate: query?.populate,
        pagination: { page, pageSize },
      }),
      safeCountDocuments(strapi, UID, { filters }),
    ]);

    const enriched = await Promise.all(
      (data as any[]).map(async (item) => {
        const tagDocId = item.documentId;
        const [postsCount, toursCount] = await Promise.all([
          countUniqueLinkedDocuments(strapi, POST_UID, tagDocId),
          countUniqueLinkedDocuments(strapi, TOUR_UID, tagDocId),
        ]);
        return {
          ...item,
          postsCount: postsCount ?? 0,
          toursCount: toursCount ?? 0,
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
      populate: query?.populate,
      fields: query?.fields,
      locale: query?.locale,
    });
  },

  async createForAdmin(payload: any) {
    return strapi.documents(UID).create({
      data: payload ?? {},
    });
  },

  async updateForAdmin(documentId: string, payload: any) {
    return strapi.documents(UID).update({
      documentId,
      data: payload ?? {},
    });
  },

  async deleteForAdmin(documentId: string) {
    return strapi.documents(UID).delete({ documentId });
  },

  async publishForAdmin(documentId: string) {
    const documentsApi = strapi.documents(UID) as any;
    if (typeof documentsApi.publish === 'function') {
      try {
        const result = await documentsApi.publish({ documentId });
        return result?.entries?.[0] ?? null;
      } catch {
        // Tag does not use draft/publish in this project.
      }
    }

    return documentsApi.findOne({ documentId });
  },

  async unpublishForAdmin(documentId: string) {
    const documentsApi = strapi.documents(UID) as any;
    if (typeof documentsApi.unpublish === 'function') {
      try {
        return documentsApi.unpublish({ documentId });
      } catch {
        // Tag does not use draft/publish in this project.
      }
    }

    return documentsApi.findOne({ documentId });
  },
}));
