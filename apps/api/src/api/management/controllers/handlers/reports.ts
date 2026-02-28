import { getStrapi, readDocumentId } from '../../helpers/common';

const UID = 'api::interaction.interaction';

function toPagination(query: any) {
  const page = Math.max(1, Number(query?.pagination?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pagination?.pageSize ?? 10) || 10));
  return { page, pageSize };
}

export default {
  async listReports(ctx: any) {
    const strapi = getStrapi();
    const { page, pageSize } = toPagination(ctx.query);
    const q = String(ctx.query?.q ?? '').trim();
    const targetType = String(ctx.query?.targetType ?? '').trim().toLowerCase();

    const filters: Record<string, any> = { actionType: 'report' };
    const qFilters = q
      ? {
          $or: [
            { targetType: { $containsi: q } },
            { targetDocumentId: { $containsi: q } },
          ],
        }
      : null;

    if (targetType && targetType !== 'all') {
      filters.targetType = targetType;
    }
    const where = qFilters ? { $and: [filters, qFilters] } : filters;

    const [data, total] = await Promise.all([
      strapi.documents(UID).findMany({
        filters: where,
        sort: ctx.query?.sort ?? 'updatedAt:desc',
        populate: {
          user: { fields: ['id', 'username', 'email'] },
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

  async deleteReport(ctx: any) {
    const strapi = getStrapi();
    const documentId = readDocumentId(ctx);
    if (!documentId) return;

    await strapi.documents(UID).delete({ documentId });
    ctx.body = { data: { documentId } };
  },
};

