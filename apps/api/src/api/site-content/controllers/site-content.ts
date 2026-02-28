const HOMEPAGE_UID = 'api::site-homepage.site-homepage';
const CONTENT_PAGE_UID = 'api::content-page.content-page';

export default {
  async homepage(ctx: any) {
    const strapi = (global as any).strapi;
    const data = await strapi.documents(HOMEPAGE_UID).findFirst();
    ctx.body = { data: data ?? null };
  },

  async pages(ctx: any) {
    const strapi = (global as any).strapi;
    const rows = await strapi.documents(CONTENT_PAGE_UID).findMany({
      sort: ['sortOrder:asc', 'title:asc'],
      fields: ['id', 'documentId', 'title', 'slug', 'summary', 'navigationLabel', 'showInHeader', 'showInFooter', 'sortOrder'],
    });
    ctx.body = { data: rows ?? [] };
  },

  async pageBySlug(ctx: any) {
    const strapi = (global as any).strapi;
    const slug = String(ctx.params?.slug ?? '').trim();
    if (!slug) {
      return ctx.badRequest('Slug is required');
    }

    const rows = await strapi.documents(CONTENT_PAGE_UID).findMany({
      filters: { slug: { $eq: slug } },
      limit: 1,
    });
    const data = Array.isArray(rows) ? rows[0] : null;
    if (!data) {
      return ctx.notFound('Content page not found');
    }
    ctx.body = { data };
  },
};
