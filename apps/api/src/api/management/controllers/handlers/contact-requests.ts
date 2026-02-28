import { getStrapi, readDocumentId } from '../../helpers/common';

const UID = 'api::contact-request.contact-request';

function toPagination(query: any) {
  const page = Math.max(1, Number(query?.pagination?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pagination?.pageSize ?? 10) || 10));
  return { page, pageSize };
}

export default {
  async listContactRequests(ctx: any) {
    const strapi = getStrapi();
    const { page, pageSize } = toPagination(ctx.query);
    const q = String(ctx.query?.q ?? '').trim();
    const status = String(ctx.query?.status ?? '').trim().toLowerCase();
    const targetType = String(ctx.query?.targetType ?? '').trim().toLowerCase();

    const filters: Record<string, any> = {};
    if (status && status !== 'all') {
      filters.status = status;
    }
    if (targetType && targetType !== 'all') {
      filters.targetType = targetType;
    }

    const qFilters = q
      ? {
          $or: [
            { requesterName: { $containsi: q } },
            { requesterEmail: { $containsi: q } },
            { targetTitle: { $containsi: q } },
            { targetDocumentId: { $containsi: q } },
            { message: { $containsi: q } },
          ],
        }
      : null;

    const where =
      Object.keys(filters).length > 0
        ? qFilters
          ? { $and: [filters, qFilters] }
          : filters
        : qFilters ?? undefined;

    const [data, total] = await Promise.all([
      strapi.documents(UID).findMany({
        filters: where,
        sort: ctx.query?.sort ?? 'updatedAt:desc',
        populate: {
          requesterUser: { fields: ['id', 'username', 'email'] },
          ownerUser: { fields: ['id', 'username', 'email'] },
        },
        pagination: { page, pageSize },
      }),
      strapi.documents(UID).count({ filters: where }),
    ]);

    ctx.body = {
      data,
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

  async findContactRequest(ctx: any) {
    const strapi = getStrapi();
    const documentId = readDocumentId(ctx);
    if (!documentId) return;

    const data = await strapi.documents(UID).findOne({
      documentId,
      populate: {
        requesterUser: { fields: ['id', 'username', 'email'] },
        ownerUser: { fields: ['id', 'username', 'email'] },
      },
    });

    if (!data) {
      return ctx.notFound('Contact request not found');
    }

    ctx.body = { data };
  },

  async updateContactRequest(ctx: any) {
    const strapi = getStrapi();
    const documentId = readDocumentId(ctx);
    if (!documentId) return;

    const payload = ctx.request.body?.data ?? {};
    const data = await strapi.documents(UID).update({
      documentId,
      data: payload,
    });
    ctx.body = { data };
  },
};

