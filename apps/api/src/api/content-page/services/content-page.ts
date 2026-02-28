import { factories } from '@strapi/strapi';

const UID = 'api::content-page.content-page';

function toPagination(query: any) {
  const page = Math.max(1, Number(query?.pagination?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pagination?.pageSize ?? 10) || 10));
  return { page, pageSize };
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  async listForAdmin(query: any) {
    const { page, pageSize } = toPagination(query);
    const keyword = String(query?.q ?? '').trim();
    const filters = keyword
      ? {
          $or: [
            { title: { $containsi: keyword } },
            { slug: { $containsi: keyword } },
            { navigationLabel: { $containsi: keyword } },
          ],
        }
      : query?.filters;

    const [data, total] = await Promise.all([
      strapi.documents(UID).findMany({
        sort: query?.sort ?? ['sortOrder:asc', 'title:asc'],
        filters,
        pagination: { page, pageSize },
      }),
      strapi.documents(UID).count({ filters }),
    ]);

    return {
      data,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.max(1, Math.ceil((total ?? 0) / pageSize)),
          total: total ?? 0,
        },
      },
    };
  },

  async findOneForAdmin(documentId: string) {
    return strapi.documents(UID).findOne({ documentId });
  },

  async createForAdmin(payload: any) {
    return strapi.documents(UID).create({ data: payload ?? {} });
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
    return strapi.documents(UID).findOne({ documentId });
  },

  async unpublishForAdmin(documentId: string) {
    return strapi.documents(UID).findOne({ documentId });
  },
}));
